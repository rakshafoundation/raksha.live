import { DirectoryCategory } from '@prisma/client';

/**
 * A real, curated Mumbai animal-welfare directory — NGOs/shelters,
 * charitable & private vet hospitals, pet stores, vet pharmacies, and
 * ambulance/pet-transport services — supplied directly by Raksha, not
 * scraped. Consumed by src/app/api/admin/directory/bulk-import/route.ts
 * (the in-app, one-click importer).
 *
 * Coordinates are neighbourhood-centroid approximations, not geocoded
 * street addresses. Two reasons: (1) it removes any dependency on an
 * external geocoder at import time — Nominatim (and similarly-policied
 * free geocoders) actively rate-limit or block requests from cloud
 * datacenter IP ranges, which is exactly what a Vercel serverless
 * function calls from, and every address failed with "could not
 * geocode" when this ran through Nominatim; (2) it matches this app's
 * own public-precision philosophy elsewhere (Case.area is deliberately
 * coarse, not an exact address) — a directory listing pointing at the
 * right neighbourhood is consistent with that, not a regression from it.
 * `address` is kept per entry for provenance/reference, not consumed by
 * the importer.
 */
export interface DirectorySeedEntry {
  name: string;
  category: DirectoryCategory;
  address: string; // full address, kept for reference — not used for placement
  area: string; // short neighbourhood label shown in the app
  latitude: number;
  longitude: number;
  phone: string | null; // null = no number was available, entry is skipped
  hours: string | null;
  isOpen24x7: boolean;
}

export const DIRECTORY_SEED_DATA: DirectorySeedEntry[] = [
  // --- Animal welfare NGOs / shelters ---
  { name: 'The Welfare of Stray Dogs (WSD)', category: 'NGO', address: 'Tokershi Jivraj Rd, near Rushabh Tower, Sewri West, Mumbai 400015', area: 'Sewri West', latitude: 19.0148, longitude: 72.8508, phone: '+91 89760 22838', hours: null, isOpen24x7: false },
  { name: 'IDA India (In Defense of Animals)', category: 'NGO', address: 'Near Deonar Colony, Baiganwadi, Deonar, Mumbai 400043', area: 'Deonar', latitude: 19.0499, longitude: 72.9106, phone: '+91 93200 56581', hours: null, isOpen24x7: false },
  { name: 'Youth Organisation in Defence of Animals (YODA)', category: 'NGO', address: '1st Fl, Farhat Villa, SV Rd, Khar West, Mumbai 400052', area: 'Khar West', latitude: 19.0728, longitude: 72.8342, phone: '+91 80 6268 9333', hours: null, isOpen24x7: false },
  { name: 'Animals Matter To Me (AMTM)', category: 'NGO', address: 'CTS 166/167 Ashram, Madh-Marve Rd, Erangal, Malad West, Mumbai 400061', area: 'Malad West', latitude: 19.187, longitude: 72.793, phone: '+91 99207 37737', hours: null, isOpen24x7: false },
  { name: 'RAWW (Resqink Association for Wildlife Welfare)', category: 'NGO', address: 'P&T Staff Colony, Mulund West, Mumbai 400080', area: 'Mulund West', latitude: 19.1726, longitude: 72.9425, phone: '+91 76666 80202', hours: null, isOpen24x7: false },
  { name: 'Rroaming Paws Foundation', category: 'NGO', address: '10/11 RSC Rd No. 10, Sector 2 Charkop, Kandivali West, Mumbai 400067', area: 'Kandivali West', latitude: 19.2065, longitude: 72.828, phone: '+91 91751 13013', hours: null, isOpen24x7: false },
  { name: 'Helping Hands Animal Welfare Foundation', category: 'NGO', address: 'RB2 Central Railway Quarters, Sion West, Mumbai 400022', area: 'Sion West', latitude: 19.043, longitude: 72.8619, phone: '+91 88502 85889', hours: null, isOpen24x7: false },
  { name: 'Animal Rescue & Shelter Foundation', category: 'NGO', address: '8-A, Bldg R-3, Parth CHS, MMRDA Colony, Poonam Nagar, Andheri East, Mumbai', area: 'Andheri East', latitude: 19.1197, longitude: 72.8697, phone: '+91 98202 77824', hours: null, isOpen24x7: false },
  { name: 'Pashupati Foundation', category: 'NGO', address: 'Shop 12, Municipal Market, Kanjurmarg East, Mumbai 400042', area: 'Kanjurmarg East', latitude: 19.1298, longitude: 72.9375, phone: '+91 97025 79362', hours: null, isOpen24x7: false },
  { name: 'Gully Stray Care', category: 'NGO', address: 'Shop 386, Hill No. 4, Azad Nagar, Ghatkopar West, Mumbai 400086', area: 'Ghatkopar West', latitude: 19.0864, longitude: 72.9081, phone: '+91 93232 63322', hours: null, isOpen24x7: false },
  { name: 'Plant & Animals Welfare Society (PAWS)', category: 'NGO', address: 'Bharat Industrial Estate, Lake Rd, Bhandup West, Mumbai 400078', area: 'Bhandup West', latitude: 19.1436, longitude: 72.9345, phone: '+91 98206 78276', hours: null, isOpen24x7: false },
  { name: 'Animal Care & Welfare Trust', category: 'NGO', address: 'Navjivan Mitra Mandal, Anand Nagar Rd, Kopri, Thane East, Thane 400603', area: 'Thane East', latitude: 19.1943, longitude: 72.9821, phone: '+91 81082 00184', hours: null, isOpen24x7: false },
  { name: 'The Feline Foundation', category: 'NGO', address: 'Bungalow 104, JP Rd, Aram Nagar Pt 2, Versova, Andheri West, Mumbai 400061', area: 'Andheri West (Versova)', latitude: 19.1317, longitude: 72.8137, phone: null, hours: null, isOpen24x7: false },
  { name: 'Raksha Animal Welfare Center (Raksha Foundation, Reg. No. 345509)', category: 'NGO', address: 'Unit 29, Laxmi Woollen Mill Estate, Shakti Mills Lane, off Dr E. Moses Rd, Mahalaxmi/Worli, Mumbai 400011', area: 'Mahalaxmi', latitude: 18.9827, longitude: 72.8206, phone: '+91 90821 98551', hours: 'Mon-Sun 10am-6pm', isOpen24x7: false },
  { name: 'Cat Center Andheri Foundation (cat sterilisation)', category: 'NGO', address: 'Mithila Apt, Bamanpuri, JB Nagar, Andheri East, Mumbai 400059', area: 'Andheri East (J B Nagar)', latitude: 19.1136, longitude: 72.8697, phone: '+91 70390 87655', hours: null, isOpen24x7: false },
  { name: 'Padma-Ratna Animal Welfare Trust', category: 'NGO', address: 'Gorai 1, Borivali West, Mumbai 400095', area: 'Borivali West (Gorai)', latitude: 19.2472, longitude: 72.7852, phone: null, hours: null, isOpen24x7: false },
  { name: 'Animal Rescue A-R Foundation', category: 'NGO', address: 'Unit 25, Aarey Milk Colony, Goregaon East, Mumbai', area: 'Goregaon East (Aarey)', latitude: 19.149, longitude: 72.8874, phone: null, hours: null, isOpen24x7: false },

  // --- Charitable / institutional + private + independent vet hospitals & clinics ---
  { name: 'Ahimsa Veterinary Clinic (stray OPD)', category: 'VET', address: 'I-B Ramchandra Ln, Evershine Nagar, Malad West, Mumbai 400064', area: 'Malad West', latitude: 19.1785, longitude: 72.839, phone: '+91 22 2880 4195', hours: '10am-1pm (stray OPD)', isOpen24x7: false },
  { name: 'Bai Sakarbai Dinshaw Petit Hospital for Animals (BSPCA)', category: 'VET', address: 'Dr SS Rao Marg, Parel East, Mumbai 400012', area: 'Parel East', latitude: 19.009, longitude: 72.841, phone: '+91 85916 59398', hours: null, isOpen24x7: true },
  { name: 'Tata Trusts Small Animal Hospital', category: 'VET', address: 'Gangaram Babu Sakpal Rd, Saat Rasta, Mahalaxmi, Mumbai 400011', area: 'Mahalaxmi', latitude: 18.9827, longitude: 72.8206, phone: '+91 22 6538 3538', hours: null, isOpen24x7: true },
  { name: 'Mumbai Veterinary College — Dept. of Clinical Medicine', category: 'VET', address: 'Dr Walimbe Rd, Parel, Mumbai 400012', area: 'Parel', latitude: 19.0072, longitude: 72.8397, phone: '+91 93230 49859', hours: null, isOpen24x7: false },
  { name: 'Crown Vet (Worli)', category: 'VET', address: 'Atur House, 87 Dr Annie Besant Rd, Worli Naka, Mumbai 400018', area: 'Worli', latitude: 19.013, longitude: 72.817, phone: '+91 80 6274 4100', hours: null, isOpen24x7: true },
  { name: 'Vetic (Chembur)', category: 'VET', address: 'Guruprasad Divine Residency, Pt CR Vyas Marg, Swastik Park, Chembur, Mumbai 400071', area: 'Chembur', latitude: 19.0522, longitude: 72.9006, phone: '+91 92050 02697', hours: null, isOpen24x7: true },
  { name: 'Vetic (Andheri West)', category: 'VET', address: 'Dadabhai Cross Rd No. 2, near Bhavans College, Andheri West, Mumbai 400058', area: 'Andheri West', latitude: 19.1244, longitude: 72.8296, phone: '+91 93555 09844', hours: null, isOpen24x7: true },
  { name: 'PetZone (Mahalaxmi)', category: 'VET', address: 'Mehar Estate, Dr Elijah Moses Rd, Mahalaxmi, Mumbai 400034', area: 'Mahalaxmi', latitude: 18.9827, longitude: 72.8206, phone: '+91 77009 57393', hours: null, isOpen24x7: true },
  { name: 'Vetgo Petcare (Andheri West)', category: 'VET', address: 'Bungalow 161, Jankidevi School Rd, Four Bungalows, Andheri West, Mumbai 400053', area: 'Andheri West', latitude: 19.1244, longitude: 72.8296, phone: '+91 80036 12340', hours: null, isOpen24x7: false },
  { name: 'Superpets Multi-Speciality', category: 'VET', address: 'Mee Mee Tower, 8th Rd, Khar West, Mumbai 400052', area: 'Khar West', latitude: 19.0728, longitude: 72.8342, phone: '+91 98211 12746', hours: null, isOpen24x7: true },
  { name: 'Wild Vets India (exotics)', category: 'VET', address: 'G1/G2 Sai Ashish Society, 368 SV Rd, Bandra West, Mumbai 400050', area: 'Bandra West', latitude: 19.0596, longitude: 72.8295, phone: '+91 98209 48166', hours: null, isOpen24x7: true },
  { name: "Pet's Paradise Multispeciality (Dr Ami Sanghavi)", category: 'VET', address: '107-109 Konarkshram, MMM Marg, Haji Ali, Tardeo, Mumbai 400034', area: 'Tardeo', latitude: 18.9827, longitude: 72.8103, phone: '+91 85910 74249', hours: null, isOpen24x7: true },
  { name: "Dr Ukale's Pet Clinic", category: 'VET', address: 'Ajmeri Chawl, Golibar Rd, Khar East, Mumbai 400051', area: 'Khar East', latitude: 19.0752, longitude: 72.8477, phone: '+91 90299 38325', hours: null, isOpen24x7: false },
  { name: 'Dr Kunal Devlekar Veterinary Service', category: 'VET', address: 'Saikrupa Rahiwashi Sangh, RP Marg, Govt Colony, Bandra East, Mumbai 400051', area: 'Bandra East', latitude: 19.0668, longitude: 72.8397, phone: '+91 98195 09185', hours: null, isOpen24x7: false },
  { name: 'Utkarsh Animal Hospital (trust-run)', category: 'VET', address: 'CTS 298/6 Sonapur Ln, behind Asian Paints, off LBS Marg, Bhandup West, Mumbai 400078', area: 'Bhandup West', latitude: 19.1436, longitude: 72.9345, phone: '+91 89769 25958', hours: null, isOpen24x7: true },
  { name: 'Vetic (Kandivali West)', category: 'VET', address: '101-102 Tara Galaxy, MG Cross Rd 4, Dahanukar Wadi, Kandivali West, Mumbai', area: 'Kandivali West', latitude: 19.2065, longitude: 72.828, phone: '+91 92050 05968', hours: null, isOpen24x7: false },
  { name: 'Vetic (Borivali West)', category: 'VET', address: '1st Fl, Percy CHS, IC Colony, Borivali West, Mumbai', area: 'Borivali West (IC Colony)', latitude: 19.2307, longitude: 72.8567, phone: '+91 98711 52481', hours: null, isOpen24x7: false },
  { name: 'Vetic (Mulund West)', category: 'VET', address: 'UG-34/35 Nirmal Galaxy, Avior Corporate Park, LBS Marg, Mulund West, Mumbai', area: 'Mulund West', latitude: 19.1726, longitude: 72.9425, phone: '+91 92112 33348', hours: null, isOpen24x7: false },
  { name: 'Blue 7 Vets (Borivali West)', category: 'VET', address: '1st Fl, Avirahi Homes, New Link Rd, IC Colony Ext, Borivali West, Mumbai', area: 'Borivali West (IC Colony)', latitude: 19.2307, longitude: 72.8567, phone: '+91 83569 61917', hours: null, isOpen24x7: false },
  { name: 'Blue 7 Vets / Papabear (South Mumbai)', category: 'VET', address: 'Gandhi House, Altamount Rd, opp. Antilia, Mumbai', area: 'Altamount Road', latitude: 18.966, longitude: 72.809, phone: '+91 85916 74477', hours: null, isOpen24x7: false },
  { name: "Pet's Paradise (Peddar Road)", category: 'VET', address: 'Unit 6, Sukh Shanti CHS, next to Jaslok Hospital, Peddar Rd, Mumbai 400026', area: 'Peddar Road', latitude: 18.97, longitude: 72.81, phone: '+91 22 2351 3100', hours: null, isOpen24x7: false },
  { name: "Dr Pethe's Veterinary Clinic", category: 'VET', address: 'Gala 7, Suyog Complex, New Link Rd, Vazira, Borivali West, Mumbai 400091', area: 'Borivali West', latitude: 19.2307, longitude: 72.8567, phone: '+91 91368 33919', hours: null, isOpen24x7: false },
  { name: "Dr Sunetra's PetVet (exotics)", category: 'VET', address: 'Shop 5, Park Riviera CHS, New MHB Colony, Borivali West, Mumbai 400091', area: 'Borivali West', latitude: 19.2307, longitude: 72.8567, phone: '+91 74003 93947', hours: null, isOpen24x7: false },
  { name: 'Vet 4 Pet', category: 'VET', address: '08 Saket Apt, TPS Rd, Gautam Nagar, Borivali West, Mumbai 400092', area: 'Borivali West', latitude: 19.2307, longitude: 72.8567, phone: '+91 98331 95939', hours: null, isOpen24x7: false },
  { name: 'AcuMed Veterinary Specialty (neurology referral)', category: 'VET', address: '19/20 Swapnapurti CHS, Thakur Village, Kandivali East, Mumbai 400101', area: 'Kandivali East', latitude: 19.2094, longitude: 72.8647, phone: '+91 22 2884 4509', hours: null, isOpen24x7: false },
  { name: 'Vetri Veterinary Clinic & Surgical Centre', category: 'VET', address: 'Shop 1, Prishank, Kandivali East Bus Depot, Mumbai 400101', area: 'Kandivali East', latitude: 19.2094, longitude: 72.8647, phone: '+91 90049 38555', hours: null, isOpen24x7: false },
  { name: 'Small & Exotic Animal Hospital', category: 'VET', address: 'Plot 507, Sector 5 Charkop, Kandivali West, Mumbai 400067', area: 'Kandivali West (Charkop)', latitude: 19.2065, longitude: 72.828, phone: '+91 99204 98984', hours: null, isOpen24x7: true },
  { name: 'HRK Veterinary Clinic', category: 'VET', address: 'Shop 8, Mahakali Dham Society, Vidyalaya Marg, Mulund East, Mumbai 400081', area: 'Mulund East', latitude: 19.1726, longitude: 72.956, phone: '+91 99300 34429', hours: null, isOpen24x7: false },
  { name: "Dr Natasha's Pet Clinic", category: 'VET', address: 'LG-37 Nirmal Galaxy, Avior Corporate Park, LBS Marg, Mulund West, Mumbai 400080', area: 'Mulund West', latitude: 19.1726, longitude: 72.9425, phone: '+91 98204 76447', hours: null, isOpen24x7: false },
  { name: 'Posh Pets / PoshVets', category: 'VET', address: 'Shop 1-2, Vasudha Bldg, off Devi Dayal Rd, Mulund West, Mumbai 400080', area: 'Mulund West', latitude: 19.1726, longitude: 72.9425, phone: '+91 74001 86600', hours: null, isOpen24x7: false },
  { name: 'Dr Parab Pet Clinic', category: 'VET', address: 'Shop 8, Randhir Vihar CHS, Gadhav Naka, Bhandup West, Mumbai 400078', area: 'Bhandup West', latitude: 19.1436, longitude: 72.9345, phone: '+91 98697 46103', hours: null, isOpen24x7: false },
  { name: 'Sunlife Veterinary Care', category: 'VET', address: 'Shop 6, Sai Darshan, Bhandup Village Rd, Nahur, Bhandup West, Mumbai 400078', area: 'Bhandup West (Nahur)', latitude: 19.1436, longitude: 72.9345, phone: '+91 89287 02013', hours: null, isOpen24x7: false },
  { name: 'Dr Mangesh PetWorld (home visits)', category: 'VET', address: 'Sunshine SRA, Lake Rd, Sonapur, Bhandup West, Mumbai 400078', area: 'Bhandup West', latitude: 19.1436, longitude: 72.9345, phone: '+91 80754 52311', hours: null, isOpen24x7: false },
  { name: "Dr Rahul's Pet Health Clinic / M&M Pet Vet Mart", category: 'VET', address: 'Shop 2, Shri Lakshmi Apt, Hema Park, Bhandup East, Mumbai 400042', area: 'Bhandup East', latitude: 19.1436, longitude: 72.942, phone: '+91 96194 72096', hours: null, isOpen24x7: false },
  { name: 'Pets Clinic', category: 'VET', address: 'Shop 3, Rajaram Yadav Society, Gadhav Naka, Bhandup West, Mumbai 400078', area: 'Bhandup West', latitude: 19.1436, longitude: 72.9345, phone: '+91 93243 34647', hours: null, isOpen24x7: false },
  { name: 'PetWell Clinic (Dr Palampalle)', category: 'VET', address: 'Palm Acre M5, Pratiksha Nagar, Sion East, Mumbai 400022', area: 'Sion East', latitude: 19.043, longitude: 72.865, phone: '+91 98209 70808', hours: null, isOpen24x7: false },
  { name: 'Dynamic Pet Clinic (Dr Atul Patil)', category: 'VET', address: 'Shop 2, Shilpin Center, GD Ambekar Marg, Wadala, Mumbai 400031', area: 'Wadala', latitude: 19.0176, longitude: 72.858, phone: '+91 81699 33922', hours: null, isOpen24x7: false },
  { name: 'Furry Tales Health Care (Dr Nitin Lavate)', category: 'VET', address: 'Shop 5, Nathalal Parekh Marg, Wadala West, Mumbai 400031', area: 'Wadala West', latitude: 19.0176, longitude: 72.858, phone: '+91 75909 09797', hours: null, isOpen24x7: false },
  { name: 'Dr Sangeeta Vengsarkar Shah', category: 'VET', address: '74 Anant Niwas, Keluskar Rd S, opp. Shivaji Park, Dadar West, Mumbai 400028', area: 'Dadar West', latitude: 19.0281, longitude: 72.842, phone: '+91 96197 15106', hours: null, isOpen24x7: false },
  { name: 'Shivaji Park Animal Clinic & Surgical Care', category: 'VET', address: '676 Om Shanti CHS, HM Patil Marg, Dadar West, Mumbai 400028', area: 'Dadar West', latitude: 19.0281, longitude: 72.842, phone: '+91 99209 98242', hours: null, isOpen24x7: false },
  { name: "Dr Makarand Chavan's Dogs & Cats Clinic", category: 'VET', address: 'Shop 1, Matoshree Tower, Padmabai Thakkar Rd, Dadar West, Mumbai 400016', area: 'Dadar West', latitude: 19.0281, longitude: 72.842, phone: '+91 22 2438 0756', hours: null, isOpen24x7: false },
  { name: 'THE VET (Dr Ujwala)', category: 'VET', address: 'Shop 1, Chandrabhaga CHS, Tata Press Lane, Prabhadevi, Mumbai 400025', area: 'Prabhadevi', latitude: 19.0176, longitude: 72.8296, phone: '+91 70210 54515', hours: null, isOpen24x7: false },
  { name: "Dr Pooja Thakur's Animal Clinic", category: 'VET', address: 'Lakhamsi Napoo Rd, next to Welingkar College, Matunga East, Mumbai 400019', area: 'Matunga East', latitude: 19.027, longitude: 72.857, phone: '+91 98928 89630', hours: null, isOpen24x7: false },
  { name: 'Dr Priya Mudur', category: 'VET', address: 'Anand Ashram, Sir Bhalchandra Rd, Matunga East, Mumbai 400019', area: 'Matunga East', latitude: 19.027, longitude: 72.857, phone: null, hours: null, isOpen24x7: false },
  { name: 'Jijai Animal Clinic & Surgical Centre', category: 'VET', address: '14 Nekjat Maratha Sadan, TB Kadam Marg, Byculla East, Mumbai 400033', area: 'Byculla East', latitude: 18.975, longitude: 72.833, phone: '+91 97731 90382', hours: null, isOpen24x7: false },
  { name: 'K-9 Pet Clinic (Dr Vedpathak)', category: 'VET', address: 'A-2 Shireen Mansion, Tardeo Rd, Mumbai 400007', area: 'Tardeo', latitude: 18.9827, longitude: 72.8103, phone: '+91 91361 18122', hours: null, isOpen24x7: false },
  { name: 'Mahalaxmi Animal Centre', category: 'VET', address: 'Shop 7, RJ Compound, Jacob Circle, Mumbai 400011', area: 'Jacob Circle (Mahalaxmi)', latitude: 18.9827, longitude: 72.8206, phone: '+91 92233 22556', hours: null, isOpen24x7: false },
  { name: 'Dr Prashanti Raaj', category: 'VET', address: '3rd Wodehouse Rd, opp. HDFC, Colaba, Mumbai 400005', area: 'Colaba', latitude: 18.9067, longitude: 72.8147, phone: null, hours: null, isOpen24x7: false },
  { name: 'The PetVet (Dr Prerna Vaswani)', category: 'VET', address: 'Shop 5, Dinshaw Vacha Rd, opp. KC College, Churchgate, Mumbai 400020', area: 'Churchgate', latitude: 18.9322, longitude: 72.8264, phone: null, hours: null, isOpen24x7: false },

  // --- Pet food & supply stores ---
  { name: 'Heads Up For Tails (Khar West)', category: 'PET_FOOD_STORE', address: '129 Kapse Chawl, Dr Ambedkar Rd, Khar West, Mumbai', area: 'Khar West', latitude: 19.0728, longitude: 72.8342, phone: '+91 99300 82944', hours: null, isOpen24x7: false },
  { name: 'Heads Up For Tails (BKC)', category: 'PET_FOOD_STORE', address: 'Jio World Drive, Bandra Kurla Complex, Mumbai', area: 'Bandra Kurla Complex', latitude: 19.0669, longitude: 72.8679, phone: '+91 96192 01276', hours: null, isOpen24x7: false },
  { name: 'Heads Up For Tails (Chembur)', category: 'PET_FOOD_STORE', address: 'Sunny Estate II, Sion-Trombay Rd, Chembur, Mumbai', area: 'Chembur', latitude: 19.0522, longitude: 72.9006, phone: '+91 82910 62429', hours: null, isOpen24x7: false },
  { name: 'Pets Mart', category: 'PET_FOOD_STORE', address: 'Opp. Bank of Maharashtra, Gandhi Nagar, Bandra East, Mumbai 400051', area: 'Bandra East', latitude: 19.0668, longitude: 72.8397, phone: '+91 70391 05095', hours: null, isOpen24x7: false },
  { name: 'Pet Food Court', category: 'PET_FOOD_STORE', address: 'Opp. Shanti Niketan, LBS Marg, Ghatkopar West, Mumbai 400086', area: 'Ghatkopar West', latitude: 19.0864, longitude: 72.9081, phone: '+91 98923 85654', hours: null, isOpen24x7: false },
  { name: 'Snoopy Petz', category: 'PET_FOOD_STORE', address: 'Shop 30/31, Bhoomi Classic, Link Rd, opp. Inorbit, Malad West, Mumbai 400064', area: 'Malad West', latitude: 19.1863, longitude: 72.8493, phone: '+91 73045 56565', hours: null, isOpen24x7: false },
  { name: 'Furry Tales Pet Store & Spa', category: 'PET_FOOD_STORE', address: 'Shop 4/5, Aristo Apt, Marol Church Rd, Andheri East, Mumbai 400059', area: 'Andheri East', latitude: 19.1197, longitude: 72.8802, phone: '+91 75063 33502', hours: null, isOpen24x7: false },
  { name: 'Royal Art Pet Shop', category: 'PET_FOOD_STORE', address: 'Ashoka Shopping Centre, SV Rd, Goregaon West, Mumbai 400104', area: 'Goregaon West', latitude: 19.1663, longitude: 72.8362, phone: '+91 98920 16423', hours: null, isOpen24x7: false },
  { name: 'Marhaba Pet Shop', category: 'PET_FOOD_STORE', address: 'Abdullah Mansion, SVP Rd, Mandvi, Mumbai 400009', area: 'Mandvi', latitude: 18.9497, longitude: 72.8322, phone: '+91 88793 46624', hours: null, isOpen24x7: false },
  { name: 'Pet Heaven', category: 'PET_FOOD_STORE', address: 'Talav Bldg, LBS Marg, Kurla West, Mumbai 400070', area: 'Kurla West', latitude: 19.0654, longitude: 72.8792, phone: '+91 98338 37633', hours: null, isOpen24x7: false },
  { name: "The Pet's Nation", category: 'PET_FOOD_STORE', address: 'Shop 14, Bldg 19/B, off Kirol Rd, Kurla West, Mumbai 400070', area: 'Kurla West', latitude: 19.0654, longitude: 72.8792, phone: '+91 98929 47670', hours: null, isOpen24x7: false },
  { name: 'Maharashtra Pet Food Shop', category: 'PET_FOOD_STORE', address: 'Shop 7, Golden Plaza, Nehru Nagar, Kurla, Mumbai 400024', area: 'Kurla', latitude: 19.0654, longitude: 72.8792, phone: '+91 98211 36670', hours: null, isOpen24x7: false },
  { name: 'Mumbai Pet Shop', category: 'PET_FOOD_STORE', address: 'Shivram Sadan, Savarkar Rd, Prabhadevi, Mumbai 400025', area: 'Prabhadevi', latitude: 19.0176, longitude: 72.8296, phone: '+91 98196 86020', hours: null, isOpen24x7: false },
  { name: 'Heads Up For Tails (Prabhadevi)', category: 'PET_FOOD_STORE', address: 'B-12/13 Mamta B CHS, Appasaheb Marathe Marg, Prabhadevi, Mumbai', area: 'Prabhadevi', latitude: 19.0176, longitude: 72.8296, phone: '+91 96199 35017', hours: null, isOpen24x7: false },
  { name: 'Heads Up For Tails (Colaba)', category: 'PET_FOOD_STORE', address: 'Shop 18, Lansdowne House, behind Regal, Colaba, Mumbai', area: 'Colaba', latitude: 18.9067, longitude: 72.8147, phone: '+91 96199 34846', hours: null, isOpen24x7: false },
  { name: 'Heads Up For Tails (Borivali West)', category: 'PET_FOOD_STORE', address: 'Shop 2-3, Avirahi Homes, IC Colony, Borivali West, Mumbai', area: 'Borivali West (IC Colony)', latitude: 19.2307, longitude: 72.8567, phone: '+91 82911 22046', hours: null, isOpen24x7: false },
  { name: 'Heads Up For Tails (Mulund West)', category: 'PET_FOOD_STORE', address: 'Shop 17, Marathon Monte Plaza, Asha Nagar, Mulund West, Mumbai', area: 'Mulund West', latitude: 19.1726, longitude: 72.9425, phone: '+91 82910 84968', hours: null, isOpen24x7: false },
  { name: 'JustDogs (Juhu)', category: 'PET_FOOD_STORE', address: 'Juhu Princess Bldg, Juhu Tara Rd, opp. Ramada, Mumbai', area: 'Juhu', latitude: 19.1075, longitude: 72.8263, phone: '+91 91044 68111', hours: null, isOpen24x7: false },
  { name: 'JustDogs (Borivali West)', category: 'PET_FOOD_STORE', address: 'B12 Sumit Garden Grove, Chikoowadi, Borivali West, Mumbai', area: 'Borivali West (Chikoowadi)', latitude: 19.2307, longitude: 72.8567, phone: '+91 73839 70111', hours: null, isOpen24x7: false },
  { name: 'JustCats', category: 'PET_FOOD_STORE', address: 'Shop 7, Kings Corner, CSM Marg, Mahim, Mumbai 400016', area: 'Mahim', latitude: 19.041, longitude: 72.8397, phone: '+91 85118 97011', hours: null, isOpen24x7: false },
  { name: 'Mark Pet Store', category: 'PET_FOOD_STORE', address: 'Shop 1, Janki Kutir, Juhu Rd, near Prithvi Theatre, Mumbai 400049', area: 'Juhu', latitude: 19.1075, longitude: 72.8263, phone: null, hours: null, isOpen24x7: false },
  { name: "Kiara's Pet Store", category: 'PET_FOOD_STORE', address: 'Shop 3, MG Rd, Navpada, Vile Parle East, Mumbai 400057', area: 'Vile Parle East', latitude: 19.0994, longitude: 72.8497, phone: '+91 96190 14001', hours: null, isOpen24x7: false },
  { name: 'Castor & Pullox Pets', category: 'PET_FOOD_STORE', address: 'Shop 5, Krishna Cottage, Hanuman Rd, Vile Parle East, Mumbai 400057', area: 'Vile Parle East', latitude: 19.0994, longitude: 72.8497, phone: '+91 97691 36563', hours: null, isOpen24x7: false },
  { name: 'Haute Dog Boutique & Grooming', category: 'GROOMER', address: 'AD Rd lane, between PVR & ISKCON, Juhu, Mumbai 400049', area: 'Juhu', latitude: 19.1075, longitude: 72.8263, phone: '+91 98200 52221', hours: null, isOpen24x7: false },
  { name: 'Doge and Cheems', category: 'PET_FOOD_STORE', address: 'B2 Kailash CHS, Juhu Rd, Vithal Nagar, Mumbai 400049', area: 'Juhu (Vithal Nagar)', latitude: 19.1075, longitude: 72.8263, phone: '+91 96199 50818', hours: null, isOpen24x7: false },
  { name: 'Doggers Stop', category: 'PET_FOOD_STORE', address: 'Divine Paradise, IC Colony Cross Rd 2, Borivali West, Mumbai 400103', area: 'Borivali West (IC Colony)', latitude: 19.2307, longitude: 72.8567, phone: '+91 93222 80640', hours: null, isOpen24x7: false },
  { name: 'Lucky Tails Pet Store & Spa', category: 'PET_FOOD_STORE', address: 'Shop 12, Kesar CHS, Charkop Sector 3, Kandivali West, Mumbai 400067', area: 'Kandivali West (Charkop)', latitude: 19.2065, longitude: 72.828, phone: '+91 93249 80110', hours: null, isOpen24x7: false },
  { name: 'Utekar Pet Care Services', category: 'PET_FOOD_STORE', address: 'Dattapada Rd, Borivali East, Mumbai 400066', area: 'Borivali East', latitude: 19.235, longitude: 72.865, phone: '+91 91375 44655', hours: null, isOpen24x7: false },
  { name: 'PetXtras', category: 'PET_FOOD_STORE', address: 'Nandanvan Society, Tata Power Colony, Borivali East, Mumbai 400066', area: 'Borivali East', latitude: 19.235, longitude: 72.865, phone: null, hours: null, isOpen24x7: false },
  { name: 'Just Love Pet', category: 'PET_FOOD_STORE', address: 'Shop 18, Raouji Sojpal Bldg, Gokhale Rd, Dadar West, Mumbai 400028', area: 'Dadar West', latitude: 19.0281, longitude: 72.842, phone: '+91 98209 15815', hours: null, isOpen24x7: false },
  { name: 'Pets Unlimited', category: 'PET_FOOD_STORE', address: 'Nathalal Parekh Marg, Wadala West/Matunga East, Mumbai 400019', area: 'Wadala West', latitude: 19.0176, longitude: 72.858, phone: '+91 91369 17331', hours: null, isOpen24x7: false },
  { name: 'Furry Cuddle (store + vet meds)', category: 'PET_FOOD_STORE', address: 'Shop 1/2, Rishabh Shopping Centre, below Chembur Naka monorail, Mumbai 400071', area: 'Chembur', latitude: 19.0522, longitude: 72.9006, phone: '+91 99676 55330', hours: null, isOpen24x7: false },
  { name: 'Star Pets Chembur', category: 'PET_FOOD_STORE', address: 'Shop 4, Navratna Apt, Sion-Trombay Rd, Maitri Park, Chembur, Mumbai 400071', area: 'Chembur', latitude: 19.0522, longitude: 72.9006, phone: '+91 99201 01104', hours: null, isOpen24x7: false },
  { name: 'The Wonder Pets Store', category: 'PET_FOOD_STORE', address: 'Shop 2, Chembur Gaothan, near Jain Mandir, Mumbai 400071', area: 'Chembur', latitude: 19.0522, longitude: 72.9006, phone: '+91 95948 92208', hours: null, isOpen24x7: false },
  { name: 'Walky Doggy', category: 'PET_FOOD_STORE', address: 'Chembur Camp, Indira Nagar, Mumbai 400074', area: 'Chembur', latitude: 19.0522, longitude: 72.9006, phone: '+91 93212 90517', hours: null, isOpen24x7: false },
  { name: 'Take Me Home Pet Shop', category: 'PET_FOOD_STORE', address: 'Shop 26, RC Marg, Postal Colony, Chembur, Mumbai 400071', area: 'Chembur', latitude: 19.0522, longitude: 72.9006, phone: '+91 89487 24779', hours: null, isOpen24x7: false },
  { name: 'Romeo Pet Store', category: 'PET_FOOD_STORE', address: 'Shop 15, Garodia Shopping Centre, Garodia Nagar, Ghatkopar East, Mumbai 400077', area: 'Ghatkopar East', latitude: 19.0855, longitude: 72.9153, phone: '+91 79773 03010', hours: null, isOpen24x7: false },

  // --- Veterinary pharmacies / medicine distributors ---
  { name: 'Goodman Chemist / Animeal', category: 'VET_PHARMACY', address: 'Dr SS Rao Marg, behind KEM Hospital, Parel, Mumbai 400012', area: 'Parel', latitude: 19.0072, longitude: 72.8397, phone: '+91 90041 57093', hours: null, isOpen24x7: true },
  { name: 'Sainath Chemist', category: 'VET_PHARMACY', address: 'Shop 4, Noorjehan Geejay CHSL, Saibaba Nagar, Borivali West, Mumbai 400092', area: 'Borivali West', latitude: 19.2307, longitude: 72.8567, phone: null, hours: null, isOpen24x7: false },
  { name: 'Veterinary Medicine Manufacturer/Wholesaler', category: 'VET_PHARMACY', address: 'Unit 9, Ranka House, Kajupada Pipeline, Kurla West, Mumbai 400070', area: 'Kurla West', latitude: 19.0654, longitude: 72.8792, phone: '+91 88281 11034', hours: null, isOpen24x7: false },
  { name: 'Veterinary Distributors (Wholesale)', category: 'VET_PHARMACY', address: 'Kirtikar Apt, Noori Baba Dargah Rd, Thane West, Thane 400601', area: 'Thane West', latitude: 19.1972, longitude: 72.9704, phone: '+91 80974 31980', hours: null, isOpen24x7: false },
  { name: 'Goodman Pet Chemist & Supply Store (Mahim)', category: 'VET_PHARMACY', address: 'Shop 5, Matoshree Tower, PT Rd, Mahim West, Mumbai 400016', area: 'Mahim West', latitude: 19.041, longitude: 72.8397, phone: '+91 90046 86193', hours: null, isOpen24x7: false },

  // --- Animal ambulance / pet transport ---
  { name: 'Vetgo Petcare — Home Service / Ambulance Desk (Andheri East)', category: 'AMBULANCE', address: 'J B Nagar, Andheri East, Mumbai', area: 'Andheri East (J B Nagar)', latitude: 19.1136, longitude: 72.8697, phone: '+91 72088 71182', hours: null, isOpen24x7: false },
  { name: 'Vetgo Petcare — Home Service / Ambulance Desk (Borivali West)', category: 'AMBULANCE', address: 'Shop 30, Shreeji Tower, Mandapeshwar Rd, Borivali West, Mumbai', area: 'Borivali West', latitude: 19.2307, longitude: 72.8567, phone: '+91 90825 52753', hours: null, isOpen24x7: false },
  { name: 'Vet Saathi (ambulance + home vet)', category: 'AMBULANCE', address: 'GD Ambekar Marg, Wadala, Mumbai 400031', area: 'Wadala', latitude: 19.0176, longitude: 72.858, phone: '+91 95943 13976', hours: null, isOpen24x7: false },
  { name: 'Trimurti Paws Pet Ambulance & Taxi (AC)', category: 'AMBULANCE', address: 'Kolivery Village, Kalina, Santacruz East, Mumbai 400098', area: 'Santacruz East', latitude: 19.0821, longitude: 72.8493, phone: '+91 98336 66616', hours: null, isOpen24x7: false },
  { name: 'Shree Venkatesh Animal Ambulance (Narendra)', category: 'AMBULANCE', address: 'Maharshi Karve Rd, Marine Lines, Mumbai 400020', area: 'Marine Lines', latitude: 18.944, longitude: 72.8236, phone: '+91 73040 80412', hours: null, isOpen24x7: true },
  { name: 'Om Ganeshay Namah Animal Emergency Ambulance (Mangesh)', category: 'AMBULANCE', address: 'Chembur, Mumbai 400037', area: 'Chembur', latitude: 19.0522, longitude: 72.9006, phone: '+91 75067 12666', hours: null, isOpen24x7: false },
  { name: 'Balaji Pet Animal Ambulance', category: 'AMBULANCE', address: 'New Link Rd, Adarsh Nagar, Andheri West, Mumbai 400102', area: 'Andheri West', latitude: 19.1364, longitude: 72.8296, phone: '+91 80820 56950', hours: null, isOpen24x7: false },
  { name: 'Sultan Animal Ambulance', category: 'AMBULANCE', address: 'Near Om Heera Panna Mall, Jogeshwari West, Mumbai 400102', area: 'Jogeshwari West', latitude: 19.1364, longitude: 72.8497, phone: '+91 90761 18255', hours: null, isOpen24x7: false },
  { name: 'Vardhaman Sanskar Dham Jeevdaya Ambulance (birds/small animals)', category: 'AMBULANCE', address: '69 Vallabh Society, Pant Nagar, Ghatkopar East, Mumbai 400075', area: 'Ghatkopar East', latitude: 19.0855, longitude: 72.9153, phone: null, hours: null, isOpen24x7: false },
  { name: 'Drant Pet Ambulance', category: 'AMBULANCE', address: 'Kalyan West, Thane 421301', area: 'Kalyan West', latitude: 19.2437, longitude: 73.1197, phone: null, hours: null, isOpen24x7: true },
];
