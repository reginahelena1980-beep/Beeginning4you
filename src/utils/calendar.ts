import { MeetingAppointment } from '../types';
import { getContactConfig, saveAppointmentWithDiagnostic } from './adminStorage';

export function getFixedGoogleMeetUrl(): string {
  return getContactConfig().meetUrl || 'https://meet.google.com/fxx-ctnv-hgm';
}

export function getOfficialEmail(): string {
  return getContactConfig().email || 'beeginning4you@gmail.com';
}

export function getOfficialWhatsApp(): string {
  return getContactConfig().whatsappNumber || '5511986297916';
}

export const FIXED_GOOGLE_MEET_URL = 'https://meet.google.com/fxx-ctnv-hgm';
export const OFFICIAL_EMAIL = 'beeginning4you@gmail.com';
export const OFFICIAL_WHATSAPP = '5511986297916';

const STORAGE_KEY = 'beeginning_scheduled_meetings_v1';

export function getSavedAppointments(): MeetingAppointment[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading appointments from localStorage', e);
    return [];
  }
}

export function saveAppointment(appointment: MeetingAppointment): MeetingAppointment[] {
  return saveAppointmentWithDiagnostic(appointment);
}

export function cancelAppointmentInStorage(id: string): MeetingAppointment[] {
  const current = getSavedAppointments();
  const updated = current.map((item) => {
    if (item.id === id) {
      return {
        ...item,
        status: 'cancelled' as const,
        updatedAt: new Date().toISOString(),
        history: [
          ...(item.history || []),
          {
            date: new Date().toISOString(),
            action: 'Reunião cancelada pelo cliente'
          }
        ]
      };
    }
    return item;
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

export function rescheduleAppointmentInStorage(
  id: string,
  newDate: string,
  newTime: string
): MeetingAppointment[] {
  const current = getSavedAppointments();
  const updated = current.map((item) => {
    if (item.id === id) {
      const prevDate = item.date;
      const prevTime = item.time;
      return {
        ...item,
        date: newDate,
        time: newTime,
        status: 'rescheduled' as const,
        updatedAt: new Date().toISOString(),
        history: [
          ...(item.history || []),
          {
            date: new Date().toISOString(),
            action: `Reagendada de ${prevDate} ${prevTime} para ${newDate} ${newTime}`
          }
        ]
      };
    }
    return item;
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

/**
 * Generates Google Calendar web sync URL with official beeginning4you@gmail.com organizer
 */
export function generateGoogleCalendarUrl(appointment: MeetingAppointment): string {
  const cleanDate = appointment.date.replace(/-/g, '');
  const [hours, minutes] = appointment.time.split(':').map(Number);
  
  const startHoursStr = String(hours).padStart(2, '0');
  const startMinutesStr = String(minutes).padStart(2, '0');
  const startTimeStr = `${startHoursStr}${startMinutesStr}00`;

  // Duration 45 minutes
  const totalMinutes = hours * 60 + minutes + (appointment.durationMinutes || 45);
  const endHours = Math.floor(totalMinutes / 60);
  const endMinutes = totalMinutes % 60;
  const endHoursStr = String(endHours).padStart(2, '0');
  const endMinutesStr = String(endMinutes).padStart(2, '0');
  const endTimeStr = `${endHoursStr}${endMinutesStr}00`;

  const title = encodeURIComponent(`Reunião Beeginning 4 You: Diagnóstico & Ideia de Negócio (${appointment.clientName})`);
  const details = encodeURIComponent(
    `Reunião Virtual de Alinhamento e Diagnóstico Digital - Beeginning 4 You\n\n` +
    `📧 Remetente Oficial: ${OFFICIAL_EMAIL}\n` +
    `👤 Participante / Cliente: ${appointment.clientName}\n` +
    `📩 Destinatário: ${appointment.clientEmail}\n` +
    `📱 WhatsApp/Telefone: ${appointment.clientPhone}\n` +
    `💡 Assunto / Pauta: ${appointment.topic || 'Discussão inicial de solução digital'}\n\n` +
    `💻 Sala Google Meet: ${appointment.meetLink || FIXED_GOOGLE_MEET_URL}\n\n` +
    `🔒 COMPROMISSO DE SIGILO E LGPD:\n` +
    `A Beeginning 4 you se compromete rigorosamente a manter o sigilo absoluto sobre todas as ideias de negócio, conceitos e informações compartilhadas neste primeiro contato e em reuniões subsequentes, garantindo total segurança e propriedade intelectual ao cliente. Além disso, asseguramos a proteção dos seus dados pessoais em total conformidade com a LGPD (Lei nº 13.709/2018), utilizando-os exclusivamente para viabilizar o nosso contato e agendamentos.\n\n` +
    `Canal Oficial: ${OFFICIAL_EMAIL}`
  );
  const location = encodeURIComponent(appointment.meetLink || FIXED_GOOGLE_MEET_URL);
  const attendees = encodeURIComponent(`${OFFICIAL_EMAIL},${appointment.clientEmail}`);

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${cleanDate}T${startTimeStr}/${cleanDate}T${endTimeStr}&details=${details}&location=${location}&add=${attendees}&ctz=America/Sao_Paulo`;
}

/**
 * Dispatches official confirmation email from beeginning4you@gmail.com to client via server API
 */
export async function sendOfficialConfirmationEmail(
  appointment: MeetingAppointment,
  isEn = false
): Promise<{ success: boolean; message?: string }> {
  const dateFormatted = appointment.date.split('-').reverse().join('/');
  const subject = isEn
    ? `Meeting Confirmed: Beeginning 4 you (${dateFormatted} at ${appointment.time})`
    : `Confirmação de Reunião: Beeginning 4 you (${dateFormatted} às ${appointment.time})`;

  const body = isEn
    ? `Hello, ${appointment.clientName}!\n\n` +
      `This is the official confirmation from Beeginning 4 you (${OFFICIAL_EMAIL}) for your scheduled meeting:\n\n` +
      `📅 Date: ${dateFormatted}\n` +
      `⏰ Time: ${appointment.time} (Brasília Time / UTC-3)\n` +
      `⏳ Duration: 45 minutes\n` +
      `💻 Google Meet Room: ${appointment.meetLink || FIXED_GOOGLE_MEET_URL}\n` +
      `💡 Topic: ${appointment.topic || 'Business idea & digital strategy'}\n\n` +
      `🔒 Confidentiality & Privacy Commitment:\n` +
      `All ideas and information discussed are protected under strict commercial secrecy and data protection laws.\n\n` +
      `Best regards,\n` +
      `Beeginning 4 you Team\n` +
      `${OFFICIAL_EMAIL}`
    : `Olá, ${appointment.clientName}!\n\n` +
      `Este é o e-mail oficial da Beeginning 4 you (${OFFICIAL_EMAIL}) confirmando o agendamento da sua reunião virtual:\n\n` +
      `📅 Data: ${dateFormatted}\n` +
      `⏰ Horário: ${appointment.time} (Horário de Brasília)\n` +
      `⏳ Duração: 45 minutos\n` +
      `💻 Sala Virtual Google Meet: ${appointment.meetLink || FIXED_GOOGLE_MEET_URL}\n` +
      `💡 Assunto: ${appointment.topic || 'Conversa inicial sobre ideia de negócio'}\n\n` +
      `🔒 Compromisso de Sigilo e LGPD:\n` +
      `A Beeginning 4 you se compromete rigorosamente a manter o sigilo absoluto sobre todas as ideias de negócio, conceitos e informações compartilhadas neste primeiro contato e em reuniões subsequentes, garantindo total segurança e propriedade intelectual ao cliente. Além disso, asseguramos a proteção dos seus dados pessoais em total conformidade com a LGPD (Lei nº 13.709/2018).\n\n` +
      `Atenciosamente,\n` +
      `Equipe Beeginning 4 you\n` +
      `${OFFICIAL_EMAIL}`;

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1A1A1A; max-width: 600px; margin: 0 auto; border: 1px solid #EAE6DF; border-radius: 12px; overflow: hidden;">
      <div style="background-color: #1E3A47; padding: 24px; color: #FFFFFF; text-align: center;">
        <h2 style="margin: 0; font-size: 20px;">Bee-ginning 4 you</h2>
        <p style="margin: 6px 0 0; font-size: 13px; color: #E5A93B;">${isEn ? 'Meeting Confirmed' : 'Reunião Confirmada com Sucesso'}</p>
      </div>
      <div style="padding: 24px; background-color: #FFFFFF;">
        <p style="font-size: 15px;">${isEn ? `Hello, <strong>${appointment.clientName}</strong>!` : `Olá, <strong>${appointment.clientName}</strong>!`}</p>
        <p style="font-size: 13px; color: #555555;">${isEn ? 'Your face-to-face video session is confirmed:' : 'Sua reunião virtual com nossa equipe está confirmada:'}</p>
        <div style="background-color: #F8F8F6; border-left: 4px solid #E5A93B; padding: 14px 18px; margin: 18px 0; border-radius: 4px;">
          <p style="margin: 4px 0; font-size: 14px;"><strong>📅 ${isEn ? 'Date:' : 'Data:'}</strong> ${dateFormatted}</p>
          <p style="margin: 4px 0; font-size: 14px;"><strong>⏰ ${isEn ? 'Time:' : 'Horário:'}</strong> ${appointment.time} (${isEn ? 'Brasília Time / UTC-3' : 'Horário de Brasília'})</p>
          <p style="margin: 4px 0; font-size: 14px;"><strong>⏳ ${isEn ? 'Duration:' : 'Duração:'}</strong> 45 min</p>
          <p style="margin: 4px 0; font-size: 14px;"><strong>💻 ${isEn ? 'Room:' : 'Sala Google Meet:'}</strong> <a href="${appointment.meetLink || FIXED_GOOGLE_MEET_URL}" style="color: #1E3A47; font-weight: bold;">${appointment.meetLink || FIXED_GOOGLE_MEET_URL}</a></p>
        </div>
        <p style="font-size: 12px; color: #666666; background-color: #FAFAFA; padding: 12px; border-radius: 8px; border: 1px solid #EAEAEA;">
          🔒 <strong>${isEn ? 'Confidentiality & Privacy:' : 'Compromisso de Sigilo e LGPD:'}</strong><br/>
          ${isEn ? 'All ideas discussed are protected under strict commercial secrecy.' : 'Garantimos sigilo absoluto sobre todas as ideias e informações compartilhadas.'}
        </p>
        <p style="font-size: 13px; margin-top: 20px;">
          ${isEn ? 'Looking forward to meeting with you!' : 'Aguardamos o nosso encontro!'}<br/>
          <strong>Equipe Bee-ginning 4 you</strong><br/>
          <a href="mailto:${OFFICIAL_EMAIL}" style="color: #1E3A47;">${OFFICIAL_EMAIL}</a>
        </p>
      </div>
    </div>
  `;

  try {
    const config = getContactConfig();
    const res = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: appointment.clientEmail,
        subject,
        text: body,
        html: htmlBody,
        appPassword: config.gmailAppPassword || undefined
      })
    });
    const data = await res.json();
    return { success: !!data?.success, message: data?.message || data?.error };
  } catch (err: any) {
    console.warn('[Email Dispatch] Falha ao acionar /api/send-email', err);
    return { success: false, message: err?.message };
  }
}

/**
 * Dispatches official rescheduling email from beeginning4you@gmail.com to client via server API
 */
export async function sendOfficialRescheduleEmail(
  appointment: MeetingAppointment,
  prevDate?: string,
  prevTime?: string,
  isEn = false
): Promise<{ success: boolean; message?: string }> {
  const newDateFormatted = appointment.date.split('-').reverse().join('/');
  const prevDateFormatted = prevDate ? prevDate.split('-').reverse().join('/') : '';
  
  const subject = isEn
    ? `Meeting Rescheduled: Beeginning 4 you (New time: ${newDateFormatted} at ${appointment.time})`
    : `Reagendamento de Reunião: Beeginning 4 you (Novo horário: ${newDateFormatted} às ${appointment.time})`;
  
  const body = isEn
    ? `Hello, ${appointment.clientName}!\n\n` +
      `Your meeting with Beeginning 4 you (${OFFICIAL_EMAIL}) has been successfully rescheduled:\n\n` +
      (prevDateFormatted ? `Previous time: ${prevDateFormatted} at ${prevTime}\n` : '') +
      `📅 NEW DATE: ${newDateFormatted}\n` +
      `⏰ NEW TIME: ${appointment.time} (Brasília Time / UTC-3)\n` +
      `⏳ Duration: 45 minutes\n` +
      `💻 Google Meet Room: ${appointment.meetLink || FIXED_GOOGLE_MEET_URL}\n\n` +
      `🔒 Confidentiality & Privacy Commitment:\n` +
      `Your ideas and project information continue to be protected under absolute confidentiality and privacy terms.\n\n` +
      `Best regards,\n` +
      `Beeginning 4 you Team\n` +
      `${OFFICIAL_EMAIL}`
    : `Olá, ${appointment.clientName}!\n\n` +
      `Confirmamos que a sua reunião com a Beeginning 4 you (${OFFICIAL_EMAIL}) foi reagendada com sucesso:\n\n` +
      (prevDateFormatted ? `Horário anterior: ${prevDateFormatted} às ${prevTime}\n` : '') +
      `📅 NOVA DATA: ${newDateFormatted}\n` +
      `⏰ NOVO HORÁRIO: ${appointment.time} (Horário de Brasília)\n` +
      `⏳ Duração: 45 minutos\n` +
      `💻 Sala Virtual Google Meet: ${appointment.meetLink || FIXED_GOOGLE_MEET_URL}\n\n` +
      `🔒 Compromisso de Sigilo e LGPD:\n` +
      `Todas as informações e ideias compartilhadas permanecem sob absoluto sigilo comercial e em conformidade com a LGPD (Lei 13.709/2018).\n\n` +
      `Atenciosamente,\n` +
      `Equipe Beeginning 4 you\n` +
      `${OFFICIAL_EMAIL}`;

  try {
    const config = getContactConfig();
    const res = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: appointment.clientEmail,
        subject,
        text: body,
        appPassword: config.gmailAppPassword || undefined
      })
    });
    const data = await res.json();
    return { success: !!data?.success, message: data?.message || data?.error };
  } catch (err: any) {
    console.warn('[Email Dispatch] Falha no backend /api/send-email', err);
    return { success: false, message: err?.message };
  }
}

/**
 * Dispatches official cancellation email from beeginning4you@gmail.com to client via server API
 */
export async function sendOfficialCancellationEmail(
  appointment: MeetingAppointment,
  isEn = false
): Promise<{ success: boolean; message?: string }> {
  const dateFormatted = appointment.date.split('-').reverse().join('/');
  const subject = isEn
    ? `Meeting Cancellation: Beeginning 4 you (${dateFormatted} at ${appointment.time})`
    : `Cancelamento de Reunião: Beeginning 4 you (${dateFormatted} às ${appointment.time})`;
  const body = isEn
    ? `Hello, ${appointment.clientName}!\n\n` +
      `This is a confirmation from Beeginning 4 you (${OFFICIAL_EMAIL}) that your meeting previously scheduled for ${dateFormatted} at ${appointment.time} has been cancelled.\n\n` +
      `If you wish to reschedule or talk to us at a more convenient time, please feel free to book a new slot on our website or reach out via WhatsApp (${OFFICIAL_WHATSAPP}).\n\n` +
      `Best regards,\n` +
      `Beeginning 4 you Team\n` +
      `${OFFICIAL_EMAIL}`
    : `Olá, ${appointment.clientName}!\n\n` +
      `Confirmamos que a sua reunião com a equipe da Beeginning 4 you (${OFFICIAL_EMAIL}), anteriormente agendada para ${dateFormatted} às ${appointment.time}, foi cancelada conforme solicitado.\n\n` +
      `Caso queira reagendar no futuro ou prefira conversar via WhatsApp (${OFFICIAL_WHATSAPP}), estamos sempre à sua disposição.\n\n` +
      `Atenciosamente,\n` +
      `Equipe Beeginning 4 you\n` +
      `${OFFICIAL_EMAIL}`;

  try {
    const config = getContactConfig();
    const res = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: appointment.clientEmail,
        subject,
        text: body,
        appPassword: config.gmailAppPassword || undefined
      })
    });
    const data = await res.json();
    return { success: !!data?.success, message: data?.message || data?.error };
  } catch (err: any) {
    console.warn('[Email Dispatch] Falha no backend /api/send-email', err);
    return { success: false, message: err?.message };
  }
}

/**
 * Generates WhatsApp URL for the CLIENT to contact REGINA (Beeginning 4 you)
 */
export function getWhatsAppUrlClientToRegina(appointment: MeetingAppointment, isEn = false): string {
  const dateFormatted = appointment.date.split('-').reverse().join('/');
  const text = encodeURIComponent(
    isEn
      ? `Hello Regina! I have just scheduled a meeting on the Beeginning 4 you website.\n\n` +
        `👤 *My Name:* ${appointment.clientName}\n` +
        `📅 *Date:* ${dateFormatted} at ${appointment.time} (BRT)\n` +
        `💻 *Meet Link:* ${appointment.meetLink || FIXED_GOOGLE_MEET_URL}\n` +
        `Looking forward to talking with you!`
      : `Olá Regina! Acabei de agendar uma reunião pelo site da Beeginning 4 you.\n\n` +
        `👤 *Meu Nome:* ${appointment.clientName}\n` +
        `📅 *Data:* ${dateFormatted} às ${appointment.time}\n` +
        `💻 *Sala Google Meet:* ${appointment.meetLink || FIXED_GOOGLE_MEET_URL}\n\n` +
        `Fico no aguardo do nosso encontro!`
  );
  return `https://wa.me/${OFFICIAL_WHATSAPP}?text=${text}`;
}

/**
 * Generates WhatsApp URL for REGINA to send confirmation to the CLIENT
 */
export function getWhatsAppUrlReginaToClient(appointment: MeetingAppointment, isEn = false): string {
  const cleanPhone = (appointment.clientPhone || '').replace(/\D/g, '');
  const phoneTarget = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
  const dateFormatted = appointment.date.split('-').reverse().join('/');
  
  const text = encodeURIComponent(
    isEn
      ? `Hello, ${appointment.clientName}! Here is Regina from *Beeginning 4 you*.\n\n` +
        `We confirm your scheduled meeting:\n` +
        `📅 *Date:* ${dateFormatted} at ${appointment.time} (BRT)\n` +
        `⏳ *Duration:* 45 minutes\n` +
        `💻 *Google Meet:* ${appointment.meetLink || FIXED_GOOGLE_MEET_URL}\n\n` +
        `🔒 Absolute confidentiality guaranteed under privacy terms.\n` +
        `See you then!`
      : `Olá, ${appointment.clientName}! Aqui é a Regina da *Beeginning 4 you*.\n\n` +
        `Confirmamos a sua reunião virtual:\n` +
        `📅 *Data:* ${dateFormatted} às ${appointment.time} (Horário de Brasília)\n` +
        `⏳ *Duração:* 45 minutos\n` +
        `💻 *Sala Google Meet:* ${appointment.meetLink || FIXED_GOOGLE_MEET_URL}\n\n` +
        `🔒 Todas as informações compartilhadas estão protegidas sob sigilo e LGPD.\n` +
        `Até logo!`
  );
  
  return `https://wa.me/${phoneTarget}?text=${text}`;
}

/**
 * Returns the upcoming 12 business days (skips weekends)
 */
export function getAvailableBusinessDays(): Array<{
  dateString: string; // YYYY-MM-DD
  dayOfWeek: string;  // Seg, Ter, Qua, Qui, Sex
  dayNumber: number;
  monthName: string;
  isToday: boolean;
}> {
  const days: Array<{
    dateString: string;
    dayOfWeek: string;
    dayNumber: number;
    monthName: string;
    isToday: boolean;
  }> = [];

  const today = new Date();
  let cursor = new Date(today);
  cursor.setDate(cursor.getDate() + 1); // Start tomorrow for booking convenience

  const weekdayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const monthNames = [
    'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
    'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
  ];

  while (days.length < 12) {
    const dayOfWeekIndex = cursor.getDay();
    // Skip Saturdays (6) and Sundays (0)
    if (dayOfWeekIndex !== 0 && dayOfWeekIndex !== 6) {
      const year = cursor.getFullYear();
      const month = String(cursor.getMonth() + 1).padStart(2, '0');
      const day = String(cursor.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${day}`;

      days.push({
        dateString,
        dayOfWeek: weekdayNames[dayOfWeekIndex],
        dayNumber: cursor.getDate(),
        monthName: monthNames[cursor.getMonth()],
        isToday: false
      });
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return days;
}

export const AVAILABLE_TIME_SLOTS = [
  '09:00',
  '10:00',
  '11:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00'
];

