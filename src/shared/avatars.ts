// Preset profile avatars (ids are stored on the profile).
export const AVATARS = [
  { id: 'queen', label: 'ملکه', url: 'https://images.fillout.com/912168/hp1wine38g/generated-images/vY5k8y5wGbSHfd9vXr6nuY/img_RiA1dHyTm6wF2kWr.jpg' },
  { id: 'curly', label: 'فرفری', url: 'https://images.fillout.com/912168/hp1wine38g/generated-images/6FdBmyvACifva8Z9hDzixt/img_bTCR0zao12sY0_48.jpg' },
  { id: 'fox', label: 'روباه', url: 'https://images.fillout.com/912168/hp1wine38g/generated-images/bLWqgvPEYG9EWRsGw1hoNJ/img_Nf-V6CWjs9D3Pcww.jpg' },
  { id: 'cat', label: 'گربه‌ی خفن', url: 'https://images.fillout.com/912168/hp1wine38g/generated-images/n4RtmgSbePCA2Zz1ZCe4aj/img_RQ3LEBRHeVbhDxkb.jpg' },
  { id: 'dj', label: 'دی‌جی', url: 'https://images.fillout.com/912168/hp1wine38g/generated-images/ctcmCVzcv67zTNjKTtkrKg/img_sCNQ4XG17XZ3Bdef.jpg' },
  { id: 'cap', label: 'کپ‌دار', url: 'https://images.fillout.com/912168/hp1wine38g/generated-images/ewadJiqoY6HLMBGPpvdyUk/img_-1tglaujYwujtdEp.jpg' },
  { id: 'robot', label: 'ربات', url: 'https://images.fillout.com/912168/hp1wine38g/generated-images/7rTWrH9dj3ktgEz9ssWDu9/img_JmUR-Mg23nZI7LTS.jpg' },
  { id: 'panda', label: 'پاندا', url: 'https://images.fillout.com/912168/hp1wine38g/generated-images/dPnBam7ZCzAFs2UMUkuCsY/img_JTS2LuQgCFmc7Cjo.jpg' },
] as const;

export const VIBES = ['شوخ', 'خونسرد', 'رمانتیک', 'رک', 'مرموز', 'سرتق'] as const;

export const avatarUrl = (id?: string | null) => AVATARS.find((a) => a.id === id)?.url ?? null;
