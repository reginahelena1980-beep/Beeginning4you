import { MeetingAppointment } from '../types';
import { getContactConfig, saveAppointmentWithDiagnostic } from './adminStorage';

export function getFixedGoogleMeetUrl(): string {
  return getContactConfig().meetUrl || 'https://meet.google.com/fxx-ctnv-hgm';
}

export function getOfficialEmail(): string {
  return getContactConfig().email || 'contato@beeginning4you.com.br';
}

export function getOfficialWhatsApp(): string {
  return getContactConfig().whatsappNumber || '';
}

export const FIXED_GOOGLE_MEET_URL = 'https://meet.google.com/fxx-ctnv-hgm';
export const OFFICIAL_EMAIL = 'contato@beeginning4you.com.br';
export const OFFICIAL_WHATSAPP = '';

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
  // Use integrated admin storage so diagnostic notes and demand records are automatically linked
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
 * Generates Google Calendar web sync URL
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
    `👤 Cliente: ${appointment.clientName}\n` +
    `📧 E-mail: ${appointment.clientEmail}\n` +
    `📱 WhatsApp/Tel: ${appointment.clientPhone}\n` +
    `💡 Assunto / Ideia: ${appointment.topic || 'Discussão inicial de solução digital'}\n\n` +
    `🔗 Sala Fixa Google Meet: ${appointment.meetLink || FIXED_GOOGLE_MEET_URL}\n\n` +
    `🔒 COMPROMISSO DE SIGILO E LGPD:\n` +
    `A Beeginning 4 you se compromete rigorosamente a manter o sigilo absoluto sobre todas as ideias de negócio, conceitos e informações compartilhadas neste primeiro contato e em reuniões subsequentes, garantindo total segurança e propriedade intelectual ao cliente. Além disso, asseguramos a proteção dos seus dados pessoais em total conformidade com a LGPD (Lei nº 13.709/2018), utilizando-os exclusivamente para viabilizar o nosso contato e agendamentos.\n\n` +
    `Canal oficial: ${OFFICIAL_EMAIL}`
  );
  const location = encodeURIComponent(appointment.meetLink || FIXED_GOOGLE_MEET_URL);
  const attendees = encodeURIComponent(`${OFFICIAL_EMAIL},${appointment.clientEmail}`);

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${cleanDate}T${startTimeStr}/${cleanDate}T${endTimeStr}&details=${details}&location=${location}&add=${attendees}&ctz=America/Sao_Paulo`;
}

/**
 * Generates and triggers download of .ics calendar file
 */
export function downloadIcsFile(appointment: MeetingAppointment): void {
  const cleanDate = appointment.date.replace(/-/g, '');
  const [hours, minutes] = appointment.time.split(':').map(Number);
  
  const startHoursStr = String(hours).padStart(2, '0');
  const startMinutesStr = String(minutes).padStart(2, '0');
  const startTimeStr = `${startHoursStr}${startMinutesStr}00`;

  const totalMinutes = hours * 60 + minutes + (appointment.durationMinutes || 45);
  const endHours = Math.floor(totalMinutes / 60);
  const endMinutes = totalMinutes % 60;
  const endHoursStr = String(endHours).padStart(2, '0');
  const endMinutesStr = String(endMinutes).padStart(2, '0');
  const endTimeStr = `${endHoursStr}${endMinutesStr}00`;

  const description = [
    `Reuniao Beeginning 4 You: Diagnostico e Ideia de Negocio`,
    `Cliente: ${appointment.clientName}`,
    `Assunto: ${appointment.topic || 'Ideia de Negocio'}`,
    `Sala Google Meet: ${appointment.meetLink || FIXED_GOOGLE_MEET_URL}`,
    `Termo de Sigilo e LGPD: A Beeginning 4 you se compromete rigorosamente a manter o sigilo absoluto sobre todas as ideias de negocio e informacoes compartilhadas, com protecao de dados conforme a LGPD.`
  ].join('\\n');

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Beeginning 4 You//Agendamento de Reuniao//PT',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:beeginning-${appointment.id}@beeginning4you.com.br`,
    `DTSTAMP:${cleanDate}T000000Z`,
    `DTSTART;TZID=America/Sao_Paulo:${cleanDate}T${startTimeStr}`,
    `DTEND;TZID=America/Sao_Paulo:${cleanDate}T${endTimeStr}`,
    `SUMMARY:Reunião Beeginning 4 You - ${appointment.clientName}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${appointment.meetLink || FIXED_GOOGLE_MEET_URL}`,
    `STATUS:${appointment.status === 'cancelled' ? 'CANCELLED' : 'CONFIRMED'}`,
    `ORGANIZER;CN=Beeginning 4 You:MAILTO:${OFFICIAL_EMAIL}`,
    `ATTENDEE;ROLE=REQ-PARTICIPANT;PARTSTAT=ACCEPTED;CN=${appointment.clientName}:MAILTO:${appointment.clientEmail}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `reuniao-beeginning-${appointment.date}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Returns the upcoming 14 business days (skips weekends)
 */
export function getAvailableBusinessDays(): Array<{
  dateString: string; // YYYY-MM-DD
  dayOfWeek: string;  // seg, ter, qua, qui, sex
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
