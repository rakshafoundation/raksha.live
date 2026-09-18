import { DirectoryCategory } from '@prisma/client';

/**
 * A real, curated Mumbai animal-welfare directory — NGOs/shelters,
 * charitable & private vet hospitals, pet stores, vet pharmacies, and
 * ambulance/pet-transport services — supplied directly by Raksha, not
 * scraped. Consumed by scripts/import-directory-data.ts (local/manual
 * run) and src/app/api/admin/directory/bulk-import/route.ts (the
 * in-app, click-to-continue importer — see that route for why it runs
 * server-side on Vercel rather than as a script run from outside it).
 */
export interface DirectorySeedEntry {
  name: string;
  category: DirectoryCategory;
  address: string; // full address, used only for geocoding
  area: string; // short neighbourhood label shown in the app
  phone: string | null; // null = no number was available, entry is skipped
  hours: string | null;
  isOpen24x7: boolean;
}

export const DIRECTORY_SEED_DATA: DirectorySeedEntry[] = [
  // --- Animal welfare NGOs / shelters ---
  { name: 'The Welfare of Stray Dogs (WSD)', category: 'NGO', address: 'Tokershi Jivraj Rd, near Rushabh Tower, Sewri West, Mumbai 400015', area: 'Sewri West', phone: '+91 89760 22838', hours: null, isOpen24x7: false },
  { name: 'IDA India (In Defense of Animals)', category: 'NGO', address: 'Near Deonar Colony, Baiganwadi, Deonar, Mumbai 400043', area: 'Deonar', phone: '+91 93200 56581', hours: null, isOpen24x7: false },
  { name: 'Youth Organisation in Defence of Animals (YODA)', category: 'NGO', address: '1st Fl, Farhat Villa, SV Rd, Khar West, Mumbai 400052', area: 'Khar West', phone: '+91 80 6268 9333', hours: null, isOpen24x7: false },
  { name: 'Animals Matter To Me (AMTM)', category: 'NGO', address: 'CTS 166/167 Ashram, Madh-Marve Rd, Erangal, Malad West, Mumbai 400061', area: 'Malad West', phone: '+91 99207 37737', hours: null, isOpen24x7: false },
  { name: 'RAWW (Resqink Association for Wildlife Welfare)', category: 'NGO', address: 'P&T Staff Colony, Mulund West, Mumbai 400080', area: 'Mulund West', phone: '+91 76666 80202', hours: null, isOpen24x7: false },
  { name: 'Rroaming Paws Foundation', category: 'NGO', address: '10/11 RSC Rd No. 10, Sector 2 Charkop, Kandivali West, Mumbai 400067', area: 'Kandivali West', phone: '+91 91751 13013', hours: null, isOpen24x7: false },
  { name: 'Helping Hands Animal Welfare Foundation', category: 'NGO', address: 'RB2 Central Railway Quarters, Sion West, Mumbai 400022', area: 'Sion West', phone: '+91 88502 85889', hours: null, isOpen24x7: false },
  { name: 'Animal Rescue & Shelter Foundation', category: 'NGO', address: '8-A, Bldg R-3, Parth CHS, MMRDA Colony, Poonam Nagar, Andheri East, Mumbai', area: 'Andheri East', phone: '+91 98202 77824', hours: null, isOpen24x7: false },
  { name: 'Pashupati Foundation', category: 'NGO', address: 'Shop 12, Municipal Market, Kanjurmarg East, Mumbai 400042', area: 'Kanjurmarg East', phone: '+91 97025 79362', hours: null, isOpen24x7: false },
  { name: 'Gully Stray Care', category: 'NGO', address: 'Shop 386, Hill No. 4, Azad Nagar, Ghatkopar West, Mumbai 400086', area: 'Ghatkopar West', phone: '+91 93232 63322', hours: null, isOpen24x7: false },
  { name: 'Plant & Animals Welfare Society (PAWS)', category: 'NGO', address: 'Bharat Industrial Estate, Lake Rd, Bhandup West, Mumbai 400078', area: 'Bhandup West', phone: '+91 98206 78276', hours: null, isOpen24x7: false },
  { name: 'Animal Care & Welfare Trust', category: 'NGO', address: 'Navjivan Mitra Mandal, Anand Nagar Rd, Kopri, Thane East, Thane 400603', area: 'Thane East', phone: '+91 81082 00184', hours: null, isOpen24x7: false },
  { name: 'The Feline Foundation', category: 'NGO', address: 'Bungalow 104, JP Rd, Aram Nagar Pt 2, Versova, Andheri West, Mumbai 400061', area: 'Andheri West (Versova)', phone: null, hours: null, isOpen24x7: false },

  // --- Charitable / institutional + private + independent vet hospitals & clinics ---
  { name: 'Ahimsa Veterinary Clinic (stray OPD)', category: 'VET', address: 'I-B Ramchandra Ln, Evershine Nagar, Malad West, Mumbai 400064', area: 'Malad West', phone: '+91 22 2880 4195', hours: '10am-1pm (stray OPD)', isOpen24x7: false },
  { name: 'Bai Sakarbai Dinshaw Petit Hospital for Animals (BSPCA)', category: 'VET', address: 'Dr SS Rao Marg, Parel East, Mumbai 400012', area: 'Parel East', phone: '+91 85916 59398', hours: null, isOpen24x7: true },
  { name: 'Tata Trusts Small Animal Hospital', category: 'VET', address: 'Gangaram Babu Sakpal Rd, Saat Rasta, Mahalaxmi, Mumbai 400011', area: 'Mahalaxmi', phone: '+91 22 6538 3538', hours: null, isOpen24x7: true },
  { name: 'Mumbai Veterinary College — Dept. of Clinical Medicine', category: 'VET', address: 'Dr Walimbe Rd, Parel, Mumbai 400012', area: 'Parel', phone: '+91 93230 49859', hours: null, isOpen24x7: false },
  { name: 'Crown Vet (Worli)', category: 'VET', address: 'Atur House, 87 Dr Annie Besant Rd, Worli Naka, Mumbai 400018', area: 'Worli', phone: '+91 80 6274 4100', hours: null, isOpen24x7: true },
  { name: 'Vetic (Chembur)', category: 'VET', address: 'Guruprasad Divine Residency, Pt CR Vyas Marg, Swastik Park, Chembur, Mumbai 400071', area: 'Chembur', phone: '+91 92050 02697', hours: null, isOpen24x7: true },
  { name: 'Vetic (Andheri West)', category: 'VET', address: 'Dadabhai Cross Rd No. 2, near Bhavans College, Andheri West, Mumbai 400058', area: 'Andheri West', phone: '+91 93555 09844', hours: null, isOpen24x7: true },
  { name: 'PetZone (Mahalaxmi)', category: 'VET', address: 'Mehar Estate, Dr Elijah Moses Rd, Mahalaxmi, Mumbai 400034', area: 'Mahalaxmi', phone: '+91 77009 57393', hours: null, isOpen24x7: true },
  { name: 'Vetgo Petcare (Andheri West)', category: 'VET', address: 'Bungalow 161, Jankidevi School Rd, Four Bungalows, Andheri West, Mumbai 400053', area: 'Andheri West', phone: '+91 80036 12340', hours: null, isOpen24x7: false },
  { name: 'Superpets Multi-Speciality', category: 'VET', address: 'Mee Mee Tower, 8th Rd, Khar West, Mumbai 400052', area: 'Khar West', phone: '+91 98211 12746', hours: null, isOpen24x7: true },
  { name: 'Wild Vets India (exotics)', category: 'VET', address: 'G1/G2 Sai Ashish Society, 368 SV Rd, Bandra West, Mumbai 400050', area: 'Bandra West', phone: '+91 98209 48166', hours: null, isOpen24x7: true },
  { name: "Pet's Paradise Multispeciality (Dr Ami Sanghavi)", category: 'VET', address: '107-109 Konarkshram, MMM Marg, Haji Ali, Tardeo, Mumbai 400034', area: 'Tardeo', phone: '+91 85910 74249', hours: null, isOpen24x7: true },
  { name: "Dr Ukale's Pet Clinic", category: 'VET', address: 'Ajmeri Chawl, Golibar Rd, Khar East, Mumbai 400051', area: 'Khar East', phone: '+91 90299 38325', hours: null, isOpen24x7: false },
  { name: 'Dr Kunal Devlekar Veterinary Service', category: 'VET', address: 'Saikrupa Rahiwashi Sangh, RP Marg, Govt Colony, Bandra East, Mumbai 400051', area: 'Bandra East', phone: '+91 98195 09185', hours: null, isOpen24x7: false },

  // --- Pet food & supply stores ---
  { name: 'Heads Up For Tails (Khar West)', category: 'PET_FOOD_STORE', address: '129 Kapse Chawl, Dr Ambedkar Rd, Khar West, Mumbai', area: 'Khar West', phone: '+91 99300 82944', hours: null, isOpen24x7: false },
  { name: 'Heads Up For Tails (BKC)', category: 'PET_FOOD_STORE', address: 'Jio World Drive, Bandra Kurla Complex, Mumbai', area: 'Bandra Kurla Complex', phone: '+91 96192 01276', hours: null, isOpen24x7: false },
  { name: 'Heads Up For Tails (Chembur)', category: 'PET_FOOD_STORE', address: 'Sunny Estate II, Sion-Trombay Rd, Chembur, Mumbai', area: 'Chembur', phone: '+91 82910 62429', hours: null, isOpen24x7: false },
  { name: 'Pets Mart', category: 'PET_FOOD_STORE', address: 'Opp. Bank of Maharashtra, Gandhi Nagar, Bandra East, Mumbai 400051', area: 'Bandra East', phone: '+91 70391 05095', hours: null, isOpen24x7: false },
  { name: 'Pet Food Court', category: 'PET_FOOD_STORE', address: 'Opp. Shanti Niketan, LBS Marg, Ghatkopar West, Mumbai 400086', area: 'Ghatkopar West', phone: '+91 98923 85654', hours: null, isOpen24x7: false },
  { name: 'Snoopy Petz', category: 'PET_FOOD_STORE', address: 'Shop 30/31, Bhoomi Classic, Link Rd, opp. Inorbit, Malad West, Mumbai 400064', area: 'Malad West', phone: '+91 73045 56565', hours: null, isOpen24x7: false },
  { name: 'Furry Tales Pet Store & Spa', category: 'PET_FOOD_STORE', address: 'Shop 4/5, Aristo Apt, Marol Church Rd, Andheri East, Mumbai 400059', area: 'Andheri East', phone: '+91 75063 33502', hours: null, isOpen24x7: false },
  { name: 'Royal Art Pet Shop', category: 'PET_FOOD_STORE', address: 'Ashoka Shopping Centre, SV Rd, Goregaon West, Mumbai 400104', area: 'Goregaon West', phone: '+91 98920 16423', hours: null, isOpen24x7: false },
  { name: 'Marhaba Pet Shop', category: 'PET_FOOD_STORE', address: 'Abdullah Mansion, SVP Rd, Mandvi, Mumbai 400009', area: 'Mandvi', phone: '+91 88793 46624', hours: null, isOpen24x7: false },
  { name: 'Pet Heaven', category: 'PET_FOOD_STORE', address: 'Talav Bldg, LBS Marg, Kurla West, Mumbai 400070', area: 'Kurla West', phone: '+91 98338 37633', hours: null, isOpen24x7: false },
  { name: "The Pet's Nation", category: 'PET_FOOD_STORE', address: 'Shop 14, Bldg 19/B, off Kirol Rd, Kurla West, Mumbai 400070', area: 'Kurla West', phone: '+91 98929 47670', hours: null, isOpen24x7: false },
  { name: 'Maharashtra Pet Food Shop', category: 'PET_FOOD_STORE', address: 'Shop 7, Golden Plaza, Nehru Nagar, Kurla, Mumbai 400024', area: 'Kurla', phone: '+91 98211 36670', hours: null, isOpen24x7: false },
  { name: 'Mumbai Pet Shop', category: 'PET_FOOD_STORE', address: 'Shivram Sadan, Savarkar Rd, Prabhadevi, Mumbai 400025', area: 'Prabhadevi', phone: '+91 98196 86020', hours: null, isOpen24x7: false },

  // --- Veterinary pharmacies / medicine distributors ---
  { name: 'Goodman Chemist / Animeal', category: 'VET_PHARMACY', address: 'Dr SS Rao Marg, behind KEM Hospital, Parel, Mumbai 400012', area: 'Parel', phone: '+91 90041 57093', hours: null, isOpen24x7: true },
  { name: 'Sainath Chemist', category: 'VET_PHARMACY', address: 'Shop 4, Noorjehan Geejay CHSL, Saibaba Nagar, Borivali West, Mumbai 400092', area: 'Borivali West', phone: null, hours: null, isOpen24x7: false },
  { name: 'Veterinary Medicine Manufacturer/Wholesaler', category: 'VET_PHARMACY', address: 'Unit 9, Ranka House, Kajupada Pipeline, Kurla West, Mumbai 400070', area: 'Kurla West', phone: '+91 88281 11034', hours: null, isOpen24x7: false },
  { name: 'Veterinary Distributors (Wholesale)', category: 'VET_PHARMACY', address: 'Kirtikar Apt, Noori Baba Dargah Rd, Thane West, Thane 400601', area: 'Thane West', phone: '+91 80974 31980', hours: null, isOpen24x7: false },

  // --- Animal ambulance / pet transport ---
  { name: 'Vetgo Petcare — Home Service / Ambulance Desk', category: 'AMBULANCE', address: 'J B Nagar, Andheri East, Mumbai', area: 'Andheri East (J B Nagar)', phone: '+91 72088 71182', hours: null, isOpen24x7: false },
  { name: 'Vet Saathi (ambulance + home vet)', category: 'AMBULANCE', address: 'GD Ambekar Marg, Wadala, Mumbai 400031', area: 'Wadala', phone: '+91 95943 13976', hours: null, isOpen24x7: false },
  { name: 'Trimurti Paws Pet Ambulance & Taxi (AC)', category: 'AMBULANCE', address: 'Kolivery Village, Kalina, Santacruz East, Mumbai 400098', area: 'Santacruz East', phone: '+91 98336 66616', hours: null, isOpen24x7: false },
  { name: 'Shree Venkatesh Animal Ambulance (Narendra)', category: 'AMBULANCE', address: 'Maharshi Karve Rd, Marine Lines, Mumbai 400020', area: 'Marine Lines', phone: '+91 73040 80412', hours: null, isOpen24x7: true },
  { name: 'Om Ganeshay Namah Animal Emergency Ambulance (Mangesh)', category: 'AMBULANCE', address: 'Chembur, Mumbai 400037', area: 'Chembur', phone: '+91 75067 12666', hours: null, isOpen24x7: false },
  { name: 'Balaji Pet Animal Ambulance', category: 'AMBULANCE', address: 'New Link Rd, Adarsh Nagar, Andheri West, Mumbai 400102', area: 'Andheri West', phone: '+91 80820 56950', hours: null, isOpen24x7: false },
  { name: 'Sultan Animal Ambulance', category: 'AMBULANCE', address: 'Near Om Heera Panna Mall, Jogeshwari West, Mumbai 400102', area: 'Jogeshwari West', phone: '+91 90761 18255', hours: null, isOpen24x7: false },
  { name: 'Vardhaman Sanskar Dham Jeevdaya Ambulance (birds/small animals)', category: 'AMBULANCE', address: '69 Vallabh Society, Pant Nagar, Ghatkopar East, Mumbai 400075', area: 'Ghatkopar East', phone: null, hours: null, isOpen24x7: false },
  { name: 'Drant Pet Ambulance', category: 'AMBULANCE', address: 'Kalyan West, Thane 421301', area: 'Kalyan West', phone: null, hours: null, isOpen24x7: true },
];
