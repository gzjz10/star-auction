import type { Club } from './types';

/** Clubs as of October 2026 (after the summer 2026 transfer window). */
export const CLUBS: Club[] = [
  // Premier League
  { code: 'ARS', name: { ar: 'أرسنال', en: 'Arsenal' }, league: 'EPL', colors: ['#EF0107', '#FFFFFF'] },
  { code: 'MCI', name: { ar: 'مانشستر سيتي', en: 'Manchester City' }, league: 'EPL', colors: ['#6CABDD', '#1C2C5B'] },
  { code: 'LIV', name: { ar: 'ليفربول', en: 'Liverpool' }, league: 'EPL', colors: ['#C8102E', '#F6EB61'] },
  { code: 'CHE', name: { ar: 'تشيلسي', en: 'Chelsea' }, league: 'EPL', colors: ['#034694', '#FFFFFF'] },
  { code: 'MUN', name: { ar: 'مانشستر يونايتد', en: 'Manchester United' }, league: 'EPL', colors: ['#DA291C', '#FBE122'] },
  { code: 'TOT', name: { ar: 'توتنهام', en: 'Tottenham Hotspur' }, league: 'EPL', colors: ['#FFFFFF', '#132257'] },
  { code: 'NEW', name: { ar: 'نيوكاسل يونايتد', en: 'Newcastle United' }, league: 'EPL', colors: ['#241F20', '#FFFFFF'] },
  { code: 'AVL', name: { ar: 'أستون فيلا', en: 'Aston Villa' }, league: 'EPL', colors: ['#670E36', '#95BFE5'] },
  // LaLiga
  { code: 'RMA', name: { ar: 'ريال مدريد', en: 'Real Madrid' }, league: 'LIGA', colors: ['#FFFFFF', '#FEBE10'] },
  { code: 'FCB', name: { ar: 'برشلونة', en: 'FC Barcelona' }, league: 'LIGA', colors: ['#A50044', '#004D98'] },
  { code: 'ATM', name: { ar: 'أتلتيكو مدريد', en: 'Atlético Madrid' }, league: 'LIGA', colors: ['#CB3524', '#272E61'] },
  { code: 'ATH', name: { ar: 'أتلتيك بلباو', en: 'Athletic Club' }, league: 'LIGA', colors: ['#EE2523', '#FFFFFF'] },
  // Serie A
  { code: 'INT', name: { ar: 'إنتر ميلان', en: 'Inter' }, league: 'SA', colors: ['#010E80', '#000000'] },
  { code: 'MIL', name: { ar: 'ميلان', en: 'AC Milan' }, league: 'SA', colors: ['#FB090B', '#000000'] },
  { code: 'JUV', name: { ar: 'يوفنتوس', en: 'Juventus' }, league: 'SA', colors: ['#000000', '#FFFFFF'] },
  { code: 'NAP', name: { ar: 'نابولي', en: 'Napoli' }, league: 'SA', colors: ['#12A0D7', '#FFFFFF'] },
  { code: 'ROM', name: { ar: 'روما', en: 'AS Roma' }, league: 'SA', colors: ['#8E1F2F', '#F0BC42'] },
  { code: 'COM', name: { ar: 'كومو', en: 'Como' }, league: 'SA', colors: ['#0E3B83', '#FFFFFF'] },
  // Bundesliga
  { code: 'BAY', name: { ar: 'بايرن ميونخ', en: 'Bayern Munich' }, league: 'BL', colors: ['#DC052D', '#FFFFFF'] },
  { code: 'BVB', name: { ar: 'بوروسيا دورتموند', en: 'Borussia Dortmund' }, league: 'BL', colors: ['#FDE100', '#000000'] },
  { code: 'B04', name: { ar: 'باير ليفركوزن', en: 'Bayer Leverkusen' }, league: 'BL', colors: ['#E32221', '#000000'] },
  // Ligue 1
  { code: 'PSG', name: { ar: 'باريس سان جيرمان', en: 'Paris Saint-Germain' }, league: 'L1', colors: ['#004170', '#DA291C'] },
  { code: 'OM', name: { ar: 'مارسيليا', en: 'Olympique de Marseille' }, league: 'L1', colors: ['#FFFFFF', '#2FAEE0'] },
  { code: 'RCL', name: { ar: 'لانس', en: 'RC Lens' }, league: 'L1', colors: ['#FFE500', '#EC1C24'] },
  // Saudi Pro League
  { code: 'HIL', name: { ar: 'الهلال', en: 'Al Hilal' }, league: 'SPL', colors: ['#1E4FA3', '#FFFFFF'] },
  { code: 'NAS', name: { ar: 'النصر', en: 'Al Nassr' }, league: 'SPL', colors: ['#FFDD00', '#1C3F94'] },
  { code: 'ITT', name: { ar: 'الاتحاد', en: 'Al Ittihad' }, league: 'SPL', colors: ['#FCD116', '#000000'] },
  { code: 'AHL', name: { ar: 'الأهلي السعودي', en: 'Al Ahli' }, league: 'SPL', colors: ['#00843D', '#FFFFFF'] },
  { code: 'QAD', name: { ar: 'القادسية', en: 'Al Qadsiah' }, league: 'SPL', colors: ['#C8102E', '#FFD100'] },
  { code: 'RIY', name: { ar: 'الرياض', en: 'Al Riyadh' }, league: 'SPL', colors: ['#D71920', '#000000'] },
  // Egypt
  { code: 'AHY', name: { ar: 'الأهلي المصري', en: 'Al Ahly' }, league: 'EGY', colors: ['#C8102E', '#FFFFFF'] },
  { code: 'ZAM', name: { ar: 'الزمالك', en: 'Zamalek' }, league: 'EGY', colors: ['#FFFFFF', '#E30613'] },
  // Türkiye
  { code: 'GAL', name: { ar: 'غلطة سراي', en: 'Galatasaray' }, league: 'TSL', colors: ['#A90432', '#FDB912'] },
  { code: 'FEN', name: { ar: 'فنربخشة', en: 'Fenerbahçe' }, league: 'TSL', colors: ['#002D72', '#FFED00'] },
  { code: 'TRA', name: { ar: 'طرابزون سبور', en: 'Trabzonspor' }, league: 'TSL', colors: ['#8B1538', '#5BC2E7'] },
  { code: 'KON', name: { ar: 'قونيا سبور', en: 'Konyaspor' }, league: 'TSL', colors: ['#00843D', '#FFFFFF'] },
  // Portugal
  { code: 'FCP', name: { ar: 'بورتو', en: 'FC Porto' }, league: 'POR', colors: ['#003893', '#FFFFFF'] },
  // MLS
  { code: 'MIA', name: { ar: 'إنتر ميامي', en: 'Inter Miami' }, league: 'MLS', colors: ['#F7B5CD', '#231F20'] },
  { code: 'LAFC', name: { ar: 'لوس أنجلوس إف سي', en: 'LAFC' }, league: 'MLS', colors: ['#000000', '#C39E6D'] },
  { code: 'ORL', name: { ar: 'أورلاندو سيتي', en: 'Orlando City' }, league: 'MLS', colors: ['#633492', '#FFFFFF'] },
  { code: 'CHI', name: { ar: 'شيكاغو فاير', en: 'Chicago Fire' }, league: 'MLS', colors: ['#AF2626', '#0A174A'] },
  // Other leagues
  { code: 'SAN', name: { ar: 'سانتوس', en: 'Santos' }, league: 'OTHER', colors: ['#FFFFFF', '#000000'] },
  { code: 'GHA', name: { ar: 'الغرافة', en: 'Al-Gharafa' }, league: 'OTHER', colors: ['#FFD200', '#1F3F93'] },
  { code: 'RAY', name: { ar: 'الريان', en: 'Al-Rayyan' }, league: 'OTHER', colors: ['#E2001A', '#000000'] },
  { code: 'PAK', name: { ar: 'باختاكور', en: 'Pakhtakor' }, league: 'OTHER', colors: ['#00A651', '#FFFFFF'] },
];
