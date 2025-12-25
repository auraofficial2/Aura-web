
import { Ticket, PrizeType, Announcement, AppConfig, Winner } from '../types';

const TICKETS_KEY = 'aura_tickets_v2';
const WINNERS_KEY = 'aura_winners_v1';
const ANNOUNCEMENT_KEY = 'aura_announcement_v1';
const NEWS_ARCHIVE_KEY = 'aura_news_archive_v1';
const CONFIG_KEY = 'aura_config_v1';

const DEFAULT_CONFIG: AppConfig = {
  jazzCash: "0300-0000000",
  jazzCashName: "Aura Treasury",
  easyPaisa: "0345-0000000",
  easyPaisaName: "Aura Treasury",
  bankAccount: "1234567890123456",
  bankAccountName: "Aura Platinum Executive",
  ticketPrice: 100,
  adminEmail: 'Shazib@Aura.com',
  adminName: 'Master Admin',
  adminKey: 'Shazibpassword7756',
  referralRequirement: 5,
  managementLink: "https://wa.me/923000000000",
  prizeImages: {
    [PrizeType.MOBILE]: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?q=80&w=800&auto=format&fit=crop",
    [PrizeType.BIKE]: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=800&auto=format&fit=crop",
    [PrizeType.FAN]: "https://images.unsplash.com/photo-1591154665855-51fa6d6bb10c?q=80&w=800&auto=format&fit=crop"
  }
};

export const getTickets = (): Ticket[] => {
  const saved = localStorage.getItem(TICKETS_KEY);
  return saved ? JSON.parse(saved) : [];
};

export const saveTicket = (ticket: Ticket) => {
  const tickets = getTickets();
  // Ensure ID uniqueness
  if (tickets.some(t => t.id === ticket.id)) {
    ticket.id = ticket.id + '-' + Math.random().toString(36).substr(2, 4);
  }
  tickets.push(ticket);
  localStorage.setItem(TICKETS_KEY, JSON.stringify(tickets));
};

export const getWinners = (): Winner[] => {
  const saved = localStorage.getItem(WINNERS_KEY);
  return saved ? JSON.parse(saved) : [];
};

export const declareWinner = (ticket: Ticket) => {
  const winners = getWinners();
  const tickets = getTickets();
  
  const ticketIndex = tickets.findIndex(t => t.id === ticket.id);
  if (ticketIndex !== -1) {
    tickets[ticketIndex].isWinner = true;
    localStorage.setItem(TICKETS_KEY, JSON.stringify(tickets));
  }

  const newWinner: Winner = {
    id: Math.random().toString(36).substr(2, 9),
    ticketId: ticket.id,
    name: ticket.name,
    prize: ticket.prize,
    ticketNumber: ticket.ticketNumber,
    timestamp: Date.now()
  };
  winners.push(newWinner);
  localStorage.setItem(WINNERS_KEY, JSON.stringify(winners));
  
  // Also add to news archive
  saveAnnouncement(`NEW WINNER: ${ticket.name} secured a ${ticket.prize}!`, true);
  
  return newWinner;
};

export const getNewsArchive = (): Announcement[] => {
  const saved = localStorage.getItem(NEWS_ARCHIVE_KEY);
  return saved ? JSON.parse(saved) : [];
};

export const getAnnouncement = (): Announcement => {
  const saved = localStorage.getItem(ANNOUNCEMENT_KEY);
  return saved ? JSON.parse(saved) : { text: "Network Sync Established. VIP Draw Node Active.", timestamp: Date.now() };
};

export const saveAnnouncement = (text: string, isBreaking = false) => {
  const announcement: Announcement = { text, timestamp: Date.now(), isBreaking };
  localStorage.setItem(ANNOUNCEMENT_KEY, JSON.stringify(announcement));
  
  // Update archive
  const archive = getNewsArchive();
  archive.unshift(announcement);
  localStorage.setItem(NEWS_ARCHIVE_KEY, JSON.stringify(archive.slice(0, 50)));
  
  return announcement;
};

export const updateTicketStatus = (id: string, status: 'approved' | 'rejected', adminIdentifier: string) => {
  const tickets = getTickets();
  const index = tickets.findIndex(t => t.id === id);
  if (index !== -1) {
    tickets[index].status = status;
    tickets[index].processedBy = adminIdentifier;
    tickets[index].processedAt = Date.now();
    localStorage.setItem(TICKETS_KEY, JSON.stringify(tickets));
  }
};

export const getConfig = (): AppConfig => {
  const saved = localStorage.getItem(CONFIG_KEY);
  return saved ? JSON.parse(saved) : DEFAULT_CONFIG;
};

export const saveConfig = (config: AppConfig) => {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
};
