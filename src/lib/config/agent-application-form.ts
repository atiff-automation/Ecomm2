/**
 * Agent Application Form Configuration
 * Single source of truth for form structure, steps, and field definitions
 * Following CLAUDE.md principles: DRY, centralized, no hardcode
 */

export const FORM_STEPS = [
  {
    id: 'terms',
    title: 'Syarat Pengambilan',
    subtitle: 'Syarat Pengambilan Jutawan Bonda 4',
    fields: ['acceptTerms'],
    description: 'Sila baca dan setuju dengan syarat-syarat pengambilan sebelum meneruskan permohonan.'
  },
  {
    id: 'basic-info',
    title: 'Maklumat Asas',
    subtitle: 'Borang Pengambilan Jutawan Bonda 4',
    fields: [
      'fullName',
      'icNumber',
      'phoneNumber',
      'address',
      'email',
      'age',
      'hasBusinessExp',
      'businessLocation',
      'hasTeamLeadExp',
      'isRegistered',
      'jenis'
    ],
    description: 'Lengkapkan maklumat peribadi dan pengalaman perniagaan anda.'
  },
  {
    id: 'social-media',
    title: 'Media Sosial',
    subtitle: 'Maklumat Media Sosial',
    fields: [
      'instagramHandle',
      'facebookHandle',
      'tiktokHandle',
      'instagramLevel',
      'facebookLevel',
      'tiktokLevel'
    ],
    description: 'Nyatakan akaun media sosial dan tahap kemahiran anda.'
  },
  {
    id: 'additional-info',
    title: 'Maklumat Lain',
    subtitle: 'Maklumat Tambahan',
    fields: [
      'hasJrmExp',
      'jrmProducts',
      'reasonToJoin',
      'expectations'
    ],
    description: 'Kongsikan pengalaman dan motivasi anda untuk menyertai program ini.'
  },
  {
    id: 'review',
    title: 'Pengakuan Pemohon',
    subtitle: 'Semakan dan Pengesahan',
    fields: ['finalAgreement'],
    description: 'Semak semula maklumat anda dan sahkan permohonan.'
  }
] as const;

export const SOCIAL_MEDIA_LEVELS = {
  TIDAK_MAHIR: 'Tidak mahir',
  MAHIR: 'Mahir',
  SANGAT_MAHIR: 'Sangat mahir'
} as const;

export const BUSINESS_TYPES = {
  KEDAI: 'Kedai',
  MUDAH: 'Mudah',
  TIDAK_BERKAITAN: 'Tidak berkaitan',
  LAIN_LAIN: 'Lain-lain'
} as const;

export const STEP_LABELS = {
  terms: 'Syarat',
  'basic-info': 'Maklumat',
  'social-media': 'Media Sosial',
  'additional-info': 'Maklumat Lain',
  review: 'Semakan'
} as const;

export const FIELD_LABELS = {
  // Step 1: Terms
  acceptTerms: 'Saya bersetuju dengan syarat-syarat yang dinyatakan',

  // Step 2: Basic Info
  fullName: 'Nama Penuh',
  icNumber: 'No Kad Pengenalan',
  phoneNumber: 'No Telefon',
  address: 'Alamat Penuh',
  email: 'Email',
  age: 'Umur',
  hasBusinessExp: 'Adakah anda ada pengalaman berniaga?',
  businessLocation: 'Nyatakan pertokolan/lokasi perniagaan anda (Isi NA jika anda tidak berniaga)',
  hasTeamLeadExp: 'Sekiranya tiada berniaga, nyatakan pengalaman sama ada (Isi NA jika tiada menakdikan seokililing ini)',
  isRegistered: 'Adakah anda mendaftar kedai?',
  jenis: 'Jenis Kedai',

  // Step 3: Social Media
  instagramHandle: 'Nama Instagram',
  facebookHandle: 'Nama Facebook',
  tiktokHandle: 'Nama TikTok',
  instagramLevel: 'Instagram',
  facebookLevel: 'Facebook',
  tiktokLevel: 'TikTok',
  socialMediaExpertise: 'Sila pilih tahap kemahiran anda dalam menggunakan media sosial',

  // Step 4: Additional Info
  hasJrmExp: 'Adakah anda ahli JRM?',
  jrmProducts: 'Keahlian dibawah pengedar/Stokis/HQ (Nyatakan nama. Tulis NA jika tiada)',
  reasonToJoin: 'Nyatakan produk JRM yang pernah anda gunakan (Tulis NA jika tiada)',
  expectations: 'Apakah sebab utama anda ingin menjadi pengedar JRM?',

  // Step 5: Review
  finalAgreement: 'Saya mengaku maklumat yang diberikan adalah benar. Pihak JRM berhak menggunakan permohonan saya sekiranya maklumat yang diberikan adalah tidak benar.'
} as const;

export const PLACEHOLDERS = {
  fullName: 'Masukkan nama penuh anda',
  icNumber: 'Contoh: 123456-12-1234',
  phoneNumber: 'Contoh: 012-3456789',
  address: 'Masukkan alamat lengkap anda',
  email: 'Contoh: nama@email.com',
  age: 'Masukkan umur anda',
  businessLocation: 'Nyatakan lokasi perniagaan atau tulis NA',
  jrmProducts: 'Nyatakan produk yang pernah digunakan atau tulis NA',
  reasonToJoin: 'Kongsikan sebab anda ingin menjadi pengedar',
  expectations: 'Nyatakan harapan anda',
  instagramHandle: 'Nama pengguna Instagram',
  facebookHandle: 'Nama pengguna Facebook',
  tiktokHandle: 'Nama pengguna TikTok'
} as const;

export const TERMS_CONTENT = {
  title: 'Syarat Pengambilan Jutawan Bonda 4',
  subtitle: 'Antaranya maklumat yang anda perlu tahu mengenai Pengedar JRM:-',
  terms: [
    {
      number: 1,
      title: 'Kami sangat menjaga harga.',
      points: [
        'Anda tidak boleh sesuka hati mengubah harga yang telah ditetapkan.',
        'Kempen promosi hanya dibuat oleh Head HQ sahaja.',
        'sekiranya gagal mematuhi kami akan gugurkan anda dari jutawan bonda dan tidak layak jual produk JRM.'
      ]
    },
    {
      number: 2,
      title: 'Pengedar boleh buat jualan online, *tetapi tidak dibenarkan di platform Shopee, Lazada dan seumpama*.'
    },
    {
      number: 3,
      title: 'Ada target sales bulanan yg ditetapkan'
    },
    {
      number: 4,
      title: 'Kami tidak buka Dropship.'
    }
  ],
  footer: 'Sekiranya anda setuju dan berminat isi maklumat di borang ini dengan lengkap.'
} as const;

export type FormStepId = typeof FORM_STEPS[number]['id'];
export type SocialMediaLevel = keyof typeof SOCIAL_MEDIA_LEVELS;
export type BusinessType = keyof typeof BUSINESS_TYPES;