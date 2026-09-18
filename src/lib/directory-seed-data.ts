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

  // --- Veterinary pharmacies / medicine distributors ---
  { name: 'Goodman Chemist / Animeal', category: 'VET_PHARMACY', address: 'Dr SS Rao Marg, behind KEM Hospital, Parel, Mumbai 400012', area: 'Parel', latitude: 19.0072, longitude: 72.8397, phone: '+91 90041 57093', hours: null, isOpen24x7: true },
  { name: 'Sainath Chemist', category: 'VET_PHARMACY', address: 'Shop 4, Noorjehan Geejay CHSL, Saibaba Nagar, Borivali West, Mumbai 400092', area: 'Borivali West', latitude: 19.2307, longitude: 72.8567, phone: null, hours: null, isOpen24x7: false },
  { name: 'Veterinary Medicine Manufacturer/Wholesaler', category: 'VET_PHARMACY', address: 'Unit 9, Ranka House, Kajupada Pipeline, Kurla West, Mumbai 400070', area: 'Kurla West', latitude: 19.0654, longitude: 72.8792, phone: '+91 88281 11034', hours: null, isOpen24x7: false },
  { name: 'Veterinary Distributors (Wholesale)', category: 'VET_PHARMACY', address: 'Kirtikar Apt, Noori Baba Dargah Rd, Thane West, Thane 400601', area: 'Thane West', latitude: 19.1972, longitude: 72.9704, phone: '+91 80974 31980', hours: null, isOpen24x7: false },

  // --- Animal ambulance / pet transport ---
  { name: 'Vetgo Petcare — Home Service / Ambulance Desk', category: 'AMBULANCE', address: 'J B Nagar, Andheri East, Mumbai', area: 'Andheri East (J B Nagar)', latitude: 19.1136, longitude: 72.8697, phone: '+91 72088 71182', hours: null, isOpen24x7: false },
  { name: 'Vet Saathi (ambulance + home vet)', category: 'AMBULANCE', address: 'GD Ambekar Marg, Wadala, Mumbai 400031', area: 'Wadala', latitude: 19.0176, longitude: 72.858, phone: '+91 95943 13976', hours: null, isOpen24x7: false },
  { name: 'Trimurti Paws Pet Ambulance & Taxi (AC)', category: 'AMBULANCE', address: 'Kolivery Village, Kalina, Santacruz East, Mumbai 400098', area: 'Santacruz East', latitude: 19.0821, longitude: 72.8493, phone: '+91 98336 66616', hours: null, isOpen24x7: false },
  { name: 'Shree Venkatesh Animal Ambulance (Narendra)', category: 'AMBULANCE', address: 'Maharshi Karve Rd, Marine Lines, Mumbai 400020', area: 'Marine Lines', latitude: 18.944, longitude: 72.8236, phone: '+91 73040 80412', hours: null, isOpen24x7: true },
  { name: 'Om Ganeshay Namah Animal Emergency Ambulance (Mangesh)', category: 'AMBULANCE', address: 'Chembur, Mumbai 400037', area: 'Chembur', latitude: 19.0522, longitude: 72.9006, phone: '+91 75067 12666', hours: null, isOpen24x7: false },
  { name: 'Balaji Pet Animal Ambulance', category: 'AMBULANCE', address: 'New Link Rd, Adarsh Nagar, Andheri West, Mumbai 400102', area: 'Andheri West', latitude: 19.1364, longitude: 72.8296, phone: '+91 80820 56950', hours: null, isOpen24x7: false },
  { name: 'Sultan Animal Ambulance', category: 'AMBULANCE', address: 'Near Om Heera Panna Mall, Jogeshwari West, Mumbai 400102', area: 'Jogeshwari West', latitude: 19.1364, longitude: 72.8497, phone: '+91 90761 18255', hours: null, isOpen24x7: false },
  { name: 'Vardhaman Sanskar Dham Jeevdaya Ambulance (birds/small animals)', category: 'AMBULANCE', address: '69 Vallabh Society, Pant Nagar, Ghatkopar East, Mumbai 400075', area: 'Ghatkopar East', latitude: 19.0855, longitude: 72.9153, phone: null, hours: null, isOpen24x7: false },
  { name: 'Drant Pet Ambulance', category: 'AMBULANCE', address: 'Kalyan West, Thane 421301', area: 'Kalyan West', latitude: 19.2437, longitude: 73.1197, phone: null, hours: null, isOpen24x7: true },
];
