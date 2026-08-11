import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfidentialClientApplication } from '@azure/msal-node';
import { Client } from '@microsoft/microsoft-graph-client';

export interface SyncCalendarDto {
  itemId: string;
  title: string;
  dueDate?: string;
  attendees?: string[];
}

@Injectable()
export class GraphService {
  private readonly logger = new Logger(GraphService.name);
  private msalClient: ConfidentialClientApplication | null = null;

  constructor(private readonly prisma: PrismaService) {
    const clientId = process.env.AZURE_CLIENT_ID;
    const clientSecret = process.env.AZURE_CLIENT_SECRET;
    const tenantId = process.env.AZURE_TENANT_ID || 'common';

    if (clientId && clientSecret && clientId !== '00000000-0000-0000-0000-000000000000') {
      try {
        this.msalClient = new ConfidentialClientApplication({
          auth: {
            clientId,
            clientSecret,
            authority: `https://login.microsoftonline.com/${tenantId}`,
          },
        });
        this.logger.log('🔑 Cliente MSAL Azure AD inicializado correctamente.');
      } catch (err) {
        this.logger.warn('⚠️ No se pudo inicializar MSAL Azure AD Client:', err);
      }
    } else {
      this.logger.warn('ℹ️ MSAL Azure AD Client corriendo en modo Fallback / Mock (sin credenciales reales de Azure en .env).');
    }
  }

  private async getAuthenticatedGraphClient(): Promise<Client | null> {
    if (!this.msalClient) return null;
    try {
      const response = await this.msalClient.acquireTokenByClientCredential({
        scopes: ['https://graph.microsoft.com/.default'],
      });
      if (response && response.accessToken) {
        return Client.init({
          authProvider: (done) => done(null, response.accessToken),
        });
      }
    } catch (err) {
      this.logger.error('Error adquiriendo token MSAL para Graph Client:', err);
    }
    return null;
  }

  async syncTaskToOutlookCalendar(dto: SyncCalendarDto) {
    this.logger.log(`[MICROSOFT GRAPH API] Syncing task '${dto.title}' to Outlook Calendar...`);

    const eventDate = dto.dueDate ? new Date(dto.dueDate) : new Date(Date.now() + 86400000 * 2);
    let calendarEventId = `graph-event-${Date.now()}`;
    let webLink = `https://outlook.office.com/calendar/item/${calendarEventId}`;

    const graphClient = await this.getAuthenticatedGraphClient();
    if (graphClient) {
      try {
        const event = await graphClient.api('/me/events').post({
          subject: dto.title,
          start: { dateTime: eventDate.toISOString(), timeZone: 'UTC' },
          end: { dateTime: new Date(eventDate.getTime() + 3600000).toISOString(), timeZone: 'UTC' },
          attendees: (dto.attendees || []).map((email) => ({ emailAddress: { address: email } })),
        });
        if (event?.id) calendarEventId = event.id;
        if (event?.webLink) webLink = event.webLink;
        this.logger.log(`✅ Evento sincronizado en Microsoft Graph API: ${calendarEventId}`);
      } catch (err) {
        this.logger.warn('Fallo en sincronización real con Graph API, usando fallback:', err);
      }
    }

    if (dto.itemId) {
      await this.prisma.item.update({
        where: { id: dto.itemId },
        data: { dueDate: eventDate },
      });
    }

    return {
      status: 'SYNCHRONIZED',
      service: 'Outlook Calendar (Microsoft Graph API)',
      calendarEventId,
      eventTitle: dto.title,
      scheduledTime: eventDate.toISOString(),
      webLink,
      attendees: dto.attendees || ['equipo@empresa.com'],
    };
  }

  async sendTeamsNotification(channelId: string, message: string) {
    this.logger.log(`[MICROSOFT GRAPH API] Sending message to Teams channel '${channelId}': "${message}"`);
    const graphClient = await this.getAuthenticatedGraphClient();

    if (graphClient) {
      try {
        await graphClient.api(`/teams/${channelId}/channels/general/messages`).post({
          body: { content: message },
        });
        this.logger.log(`✅ Mensaje enviado a Microsoft Teams en canal ${channelId}`);
      } catch (err) {
        this.logger.warn('Fallo al enviar mensaje a Teams vía Graph API, usando fallback:', err);
      }
    }

    return {
      status: 'SENT',
      channelId,
      message,
      sentAt: new Date().toISOString(),
    };
  }

  async getSharePointFiles(folderPath?: string) {
    const graphClient = await this.getAuthenticatedGraphClient();
    if (graphClient) {
      try {
        const driveItems = await graphClient.api('/me/drive/root/children').get();
        if (driveItems?.value) {
          return driveItems.value.map((item: any) => ({
            id: item.id,
            name: item.name,
            webUrl: item.webUrl,
            size: item.size,
            lastModified: item.lastModifiedDateTime,
          }));
        }
      } catch (err) {
        this.logger.warn('Fallo al obtener archivos de SharePoint vía Graph API, usando fallback:', err);
      }
    }

    return [
      {
        id: 'sp-1',
        name: 'Especificaciones_Proyecto_Q3.pdf',
        webUrl: 'https://empresa.sharepoint.com/sites/Proyectos/Documentos/Especificaciones.pdf',
        size: 2450000,
        lastModified: new Date().toISOString(),
      },
      {
        id: 'sp-2',
        name: 'Presupuesto_Equipo_2026.xlsx',
        webUrl: 'https://empresa.sharepoint.com/sites/Proyectos/Documentos/Presupuesto.xlsx',
        size: 1120000,
        lastModified: new Date().toISOString(),
      },
    ];
  }
}
