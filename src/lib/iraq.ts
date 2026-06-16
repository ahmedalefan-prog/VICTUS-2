// VICTUS — Iraqi localization data
// 18 governorates of Iraq with a representative set of districts.

export interface GovernorateSeed {
  code: string;
  nameAr: string;
  nameEn: string;
  districts: { nameAr: string; nameEn: string }[];
}

export const IRAQ_GOVERNORATES: GovernorateSeed[] = [
  {
    code: "BG",
    nameAr: "بغداد",
    nameEn: "Baghdad",
    districts: [
      { nameAr: "الكرخ", nameEn: "Karkh" },
      { nameAr: "الرصافة", nameEn: "Rusafa" },
      { nameAr: "الكاظمية", nameEn: "Kadhimiya" },
      { nameAr: "الأعظمية", nameEn: "Adhamiyah" },
      { nameAr: "المنصور", nameEn: "Mansour" },
      { nameAr: "مدينة الصدر", nameEn: "Sadr City" },
    ],
  },
  {
    code: "BS",
    nameAr: "البصرة",
    nameEn: "Basra",
    districts: [
      { nameAr: "مركز البصرة", nameEn: "Basra Center" },
      { nameAr: "الزبير", nameEn: "Zubair" },
      { nameAr: "أبو الخصيب", nameEn: "Abu Al-Khaseeb" },
      { nameAr: "القرنة", nameEn: "Qurna" },
    ],
  },
  {
    code: "NJ",
    nameAr: "النجف",
    nameEn: "Najaf",
    districts: [
      { nameAr: "مركز النجف", nameEn: "Najaf Center" },
      { nameAr: "الكوفة", nameEn: "Kufa" },
      { nameAr: "المناذرة", nameEn: "Manathera" },
    ],
  },
  {
    code: "KB",
    nameAr: "كربلاء",
    nameEn: "Karbala",
    districts: [
      { nameAr: "مركز كربلاء", nameEn: "Karbala Center" },
      { nameAr: "الهندية", nameEn: "Hindiya" },
      { nameAr: "عين التمر", nameEn: "Ain Al-Tamur" },
    ],
  },
  {
    code: "BB",
    nameAr: "بابل",
    nameEn: "Babylon",
    districts: [
      { nameAr: "الحلة", nameEn: "Hilla" },
      { nameAr: "المحاويل", nameEn: "Mahawil" },
      { nameAr: "المسيب", nameEn: "Musayyib" },
    ],
  },
  {
    code: "AN",
    nameAr: "الأنبار",
    nameEn: "Anbar",
    districts: [
      { nameAr: "الرمادي", nameEn: "Ramadi" },
      { nameAr: "الفلوجة", nameEn: "Fallujah" },
      { nameAr: "هيت", nameEn: "Hit" },
    ],
  },
  {
    code: "NI",
    nameAr: "نينوى",
    nameEn: "Nineveh",
    districts: [
      { nameAr: "الموصل", nameEn: "Mosul" },
      { nameAr: "تلعفر", nameEn: "Tal Afar" },
      { nameAr: "الحمدانية", nameEn: "Hamdaniya" },
    ],
  },
  {
    code: "DH",
    nameAr: "دهوك",
    nameEn: "Dohuk",
    districts: [
      { nameAr: "مركز دهوك", nameEn: "Dohuk Center" },
      { nameAr: "زاخو", nameEn: "Zakho" },
      { nameAr: "عقرة", nameEn: "Akre" },
    ],
  },
  {
    code: "AR",
    nameAr: "أربيل",
    nameEn: "Erbil",
    districts: [
      { nameAr: "مركز أربيل", nameEn: "Erbil Center" },
      { nameAr: "شقلاوة", nameEn: "Shaqlawa" },
      { nameAr: "سوران", nameEn: "Soran" },
    ],
  },
  {
    code: "SU",
    nameAr: "السليمانية",
    nameEn: "Sulaymaniyah",
    districts: [
      { nameAr: "مركز السليمانية", nameEn: "Sulaymaniyah Center" },
      { nameAr: "حلبجة", nameEn: "Halabja" },
      { nameAr: "رانية", nameEn: "Raniya" },
    ],
  },
  {
    code: "KI",
    nameAr: "كركوك",
    nameEn: "Kirkuk",
    districts: [
      { nameAr: "مركز كركوك", nameEn: "Kirkuk Center" },
      { nameAr: "الحويجة", nameEn: "Hawija" },
      { nameAr: "داقوق", nameEn: "Daquq" },
    ],
  },
  {
    code: "DI",
    nameAr: "ديالى",
    nameEn: "Diyala",
    districts: [
      { nameAr: "بعقوبة", nameEn: "Baquba" },
      { nameAr: "المقدادية", nameEn: "Muqdadiya" },
      { nameAr: "خانقين", nameEn: "Khanaqin" },
    ],
  },
  {
    code: "SD",
    nameAr: "صلاح الدين",
    nameEn: "Saladin",
    districts: [
      { nameAr: "تكريت", nameEn: "Tikrit" },
      { nameAr: "سامراء", nameEn: "Samarra" },
      { nameAr: "بلد", nameEn: "Balad" },
    ],
  },
  {
    code: "WA",
    nameAr: "واسط",
    nameEn: "Wasit",
    districts: [
      { nameAr: "الكوت", nameEn: "Kut" },
      { nameAr: "الصويرة", nameEn: "Suwaira" },
      { nameAr: "العزيزية", nameEn: "Aziziya" },
    ],
  },
  {
    code: "MA",
    nameAr: "ميسان",
    nameEn: "Maysan",
    districts: [
      { nameAr: "العمارة", nameEn: "Amara" },
      { nameAr: "المجر الكبير", nameEn: "Majar al-Kabir" },
      { nameAr: "علي الغربي", nameEn: "Ali al-Gharbi" },
    ],
  },
  {
    code: "QA",
    nameAr: "ذي قار",
    nameEn: "Dhi Qar",
    districts: [
      { nameAr: "الناصرية", nameEn: "Nasiriyah" },
      { nameAr: "الشطرة", nameEn: "Shatra" },
      { nameAr: "الرفاعي", nameEn: "Rifai" },
    ],
  },
  {
    code: "MU",
    nameAr: "المثنى",
    nameEn: "Muthanna",
    districts: [
      { nameAr: "السماوة", nameEn: "Samawah" },
      { nameAr: "الرميثة", nameEn: "Rumaitha" },
      { nameAr: "الخضر", nameEn: "Khidhir" },
    ],
  },
  {
    code: "QD",
    nameAr: "القادسية",
    nameEn: "Al-Qadisiyyah",
    districts: [
      { nameAr: "الديوانية", nameEn: "Diwaniyah" },
      { nameAr: "عفك", nameEn: "Afak" },
      { nameAr: "الشامية", nameEn: "Shamiya" },
    ],
  },
];
