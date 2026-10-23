import React, { createContext, useContext, useState, useEffect } from 'react';

export type SupportedLanguage = 'en' | 'ta' | 'hi' | 'ml' | 'te' | 'kn';

export interface LanguageInfo {
  code: SupportedLanguage;
  locale: string;
  name: string;
  nativeName: string;
  flag: string;
  speechSupport: 'full' | 'synthesis_only' | 'experimental';
  script: string;
}

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  {
    code: 'en',
    locale: 'en-US',
    name: 'English',
    nativeName: 'English (US & Global)',
    flag: '🇺🇸',
    speechSupport: 'full',
    script: 'Latin'
  },
  {
    code: 'ta',
    locale: 'ta-IN',
    name: 'Tamil',
    nativeName: 'தமிழ் (Tamil & Tanglish)',
    flag: '🇮🇳',
    speechSupport: 'full',
    script: 'Tamil'
  },
  {
    code: 'hi',
    locale: 'hi-IN',
    name: 'Hindi',
    nativeName: 'हिन्दी (Hindi & Hinglish)',
    flag: '🇮🇳',
    speechSupport: 'full',
    script: 'Devanagari'
  },
  {
    code: 'ml',
    locale: 'ml-IN',
    name: 'Malayalam',
    nativeName: 'മലയാളം (Malayalam)',
    flag: '🇮🇳',
    speechSupport: 'full',
    script: 'Malayalam'
  },
  {
    code: 'te',
    locale: 'te-IN',
    name: 'Telugu',
    nativeName: 'తెలుగు (Telugu)',
    flag: '🇮🇳',
    speechSupport: 'full',
    script: 'Telugu'
  },
  {
    code: 'kn',
    locale: 'kn-IN',
    name: 'Kannada',
    nativeName: 'ಕನ್ನಡ (Kannada)',
    flag: '🇮🇳',
    speechSupport: 'full',
    script: 'Kannada'
  }
];

export const TRANSLATIONS: Record<SupportedLanguage, Record<string, string>> = {
  en: {
    // Navigation
    nav_overview: 'Overview',
    nav_assistant: 'AI Voice Assistant',
    nav_conversations: 'Conversations',
    nav_tasks: 'Care Tasks',
    nav_reminders: 'Reminders',
    nav_handover: 'Caregiver Handover',
    nav_history: 'Activity History',
    nav_training: 'LLM & Training',
    nav_voice: 'Voice & Languages',
    nav_settings: 'Settings',

    // Header & Greeting
    greeting_morning: 'Good morning',
    greeting_afternoon: 'Good afternoon',
    greeting_evening: 'Good evening',
    coordinating_for: 'Coordinating for',
    primary_caregiver: 'Primary Caregiver',
    search_placeholder: 'Search care tasks, medications, vitals, or activities...',
    voice_assistant_btn: 'Voice Assistant',
    status_proactive_online: 'Proactive Agent Online',

    // Assistant Identity
    assistant_name: 'EchoCare AI',
    assistant_title: "I'm Echo, your AI assistant.",
    assistant_subtitle: 'Your voice. Your language. Your intelligent assistant.',
    briefing_title: 'Proactive Daily Care Briefing',
    briefing_on_track: 'Eleanor is on track today',
    talk_to_assistant: 'Talk to Assistant',
    prepare_handover: 'Prepare Handover',

    // One-Tap Voice Bar
    tap_to_speak: 'Tap to Speak',
    stop_listening: 'Stop Listening',
    listening_state: "I'm listening...",
    thinking_state: 'Thinking...',
    speaking_state: 'Speaking...',
    ready_state: 'Ready — Tap to Speak',
    repeat_btn: 'Repeat',
    type_instead_btn: 'Type instead',
    cheat_sheet_btn: 'Cheat Sheet',
    try_saying: 'Try Saying',
    prompt_today_tasks: 'What do I need to do today?',
    prompt_reminder: 'Remind me to call Mom at six',
    prompt_vitals: "What was Eleanor's blood pressure today?",
    prompt_handover: 'Prepare a caregiver handover for Nurse David',

    // Metrics
    tasks_due_today: 'Tasks Due Today',
    adherence_rate: 'Adherence Rate',
    active_reminders: 'Active Reminders',
    on_target: 'on target',
    scheduled: 'scheduled',
    completed: 'completed',
    pending: 'pending',

    // Common Actions
    save: 'Save',
    cancel: 'Cancel',
    confirm: 'Confirm',
    delete: 'Delete',
    view_all: 'View all',
    reset_demo: 'Reset Demo Records',
    manage_reminders: 'Manage all reminders'
  },

  ta: {
    // Navigation
    nav_overview: 'மேலோட்டம்',
    nav_assistant: 'குரல் உதவியாளர்',
    nav_conversations: 'உரையாடல்கள்',
    nav_tasks: 'பராமரிப்புப் பணிகள்',
    nav_reminders: 'நினைவூட்டல்கள்',
    nav_handover: 'பணி ஒப்படைப்பு',
    nav_history: 'செயல்பாட்டு வரலாறு',
    nav_training: 'LLM & பயிற்சி',
    nav_voice: 'குரல் & மொழிகள்',
    nav_settings: 'அமைப்புகள்',

    // Header & Greeting
    greeting_morning: 'காலை வணக்கம்',
    greeting_afternoon: 'மதிய வணக்கம்',
    greeting_evening: 'மாலை வணக்கம்',
    coordinating_for: 'பராமரிப்பு பெறுபவர்',
    primary_caregiver: 'முதன்மைக் காப்பாளர்',
    search_placeholder: 'பணிகள், மருந்துகள், நினைவூட்டல்களைத் தேடுங்கள்...',
    voice_assistant_btn: 'குரல் உதவியாளர்',
    status_proactive_online: 'உதவியாளர் செயலில் உள்ளது',

    // Assistant Identity
    assistant_name: 'எக்கோகேர் AI',
    assistant_title: 'நான் எக்கோ, உங்கள் AI உதவியாளர்.',
    assistant_subtitle: 'உங்கள் குரல். உங்கள் மொழி. உங்கள் அறிவார்ந்த துணை.',
    briefing_title: 'தினசரி பராமரிப்புச் சுருக்கம்',
    briefing_on_track: 'எலினோர் இன்று அட்டவணைப்படி உள்ளார்',
    talk_to_assistant: 'உதவியாளரிடம் பேசுங்கள்',
    prepare_handover: 'ஒப்படைப்பு தயார் செய்',

    // One-Tap Voice Bar
    tap_to_speak: 'பேச அழுத்தவும்',
    stop_listening: 'கேட்பதை நிறுத்து',
    listening_state: 'நான் கேட்கிறேன்...',
    thinking_state: 'யோசிக்கிறேன்...',
    speaking_state: 'பதிலளிக்கிறேன்...',
    ready_state: 'தயார் — பேச அழுத்தவும்',
    repeat_btn: 'மீண்டும் சொல்',
    type_instead_btn: 'எழுதுங்கள்',
    cheat_sheet_btn: 'குரல் கட்டளைகள்',
    try_saying: 'இப்படிச் சொல்லுங்கள்',
    prompt_today_tasks: 'இன்று நான் என்ன செய்ய வேண்டும்?',
    prompt_reminder: 'மாலை 6 மணிக்கு அம்மாவுக்கு அழைக்க நினைவூட்டு',
    prompt_vitals: 'எலினோரின் ரத்த அழுத்தம் என்ன?',
    prompt_handover: 'செவிலியர் டேவிட்டிற்கு ஒப்படைப்பு குறிப்பு உருவாக்கு',

    // Metrics
    tasks_due_today: 'இன்றைய பணிகள்',
    adherence_rate: 'நிறைவு விகிதம்',
    active_reminders: 'செயலில் உள்ள நினைவூட்டல்கள்',
    on_target: 'சரியாக உள்ளது',
    scheduled: 'திட்டமிடப்பட்டது',
    completed: 'முடிந்தது',
    pending: 'நிலுவையில்',

    // Common Actions
    save: 'சேமி',
    cancel: 'ரத்து செய்',
    confirm: 'உறுதி செய்',
    delete: 'நீக்கு',
    view_all: 'அனைத்தையும் பார்',
    reset_demo: 'மாதிரித் தரவை மீட்டமை',
    manage_reminders: 'நினைவூட்டல்களை நிர்வகி'
  },

  hi: {
    // Navigation
    nav_overview: 'अवलोकन',
    nav_assistant: 'वॉइस सहायक',
    nav_conversations: 'बातचीत',
    nav_tasks: 'देखभाल कार्य',
    nav_reminders: 'अनुस्मारक',
    nav_handover: 'शिफ्ट हैंडओवर',
    nav_history: 'गतिविधि इतिहास',
    nav_training: 'LLM एवं प्रशिक्षण',
    nav_voice: 'आवाज और भाषाएं',
    nav_settings: 'सेटिंग्स',

    // Header & Greeting
    greeting_morning: 'शुभ प्रभात',
    greeting_afternoon: 'शुभ दोपहर',
    greeting_evening: 'शुभ संध्या',
    coordinating_for: 'देखभाल प्राप्तकर्ता',
    primary_caregiver: 'मुख्य देखभालकर्ता',
    search_placeholder: 'कार्य, दवाएं, वाइटल्स या अनुस्मारक खोजें...',
    voice_assistant_btn: 'वॉइस सहायक',
    status_proactive_online: 'सहायक सक्रिय है',

    // Assistant Identity
    assistant_name: 'इकोकेयर AI',
    assistant_title: 'मैं इको हूँ, आपकी AI सहायक।',
    assistant_subtitle: 'आपकी आवाज़। आपकी भाषा। आपका बुद्धिमान सहायक।',
    briefing_title: 'दैनिक देखभाल संक्षिप्त विवरण',
    briefing_on_track: 'एलेनोर आज समय पर हैं',
    talk_to_assistant: 'इको से बात करें',
    prepare_handover: 'हैंडओवर तैयार करें',

    // One-Tap Voice Bar
    tap_to_speak: 'बोलने के लिए दबाएं',
    stop_listening: 'सुनना बंद करें',
    listening_state: 'मैं सुन रही हूँ...',
    thinking_state: 'सोच रही हूँ...',
    speaking_state: 'बोल रही हूँ...',
    ready_state: 'तैयार — बोलने के लिए टैप करें',
    repeat_btn: 'दोहराएं',
    type_instead_btn: 'टाइप करें',
    cheat_sheet_btn: 'आवाज आदेश',
    try_saying: 'यह कहकर देखें',
    prompt_today_tasks: 'आज मुझे क्या कार्य करने हैं?',
    prompt_reminder: 'शाम छह बजे माँ को फोन करने की याद दिलाएं',
    prompt_vitals: 'आज एलेनोर का ब्लड प्रेशर कितना था?',
    prompt_handover: 'नर्स डेविड के लिए हैंडओवर रिपोर्ट तैयार करें',

    // Metrics
    tasks_due_today: 'आज के कार्य',
    adherence_rate: 'पालन दर',
    active_reminders: 'सक्रिय अनुस्मारक',
    on_target: 'लक्ष्य पर',
    scheduled: 'निर्धारित',
    completed: 'पूर्ण',
    pending: 'लंबित',

    // Common Actions
    save: 'सहेजें',
    cancel: 'रद्द करें',
    confirm: 'पुष्टि करें',
    delete: 'हटाएं',
    view_all: 'सभी देखें',
    reset_demo: 'डेमो रीसेट करें',
    manage_reminders: 'सभी अनुस्मारक प्रबंधित करें'
  },

  ml: {
    nav_overview: 'അവലോകനം',
    nav_assistant: 'വോയ്സ് അസിസ്റ്റന്റ്',
    nav_conversations: 'സംഭാഷണങ്ങൾ',
    nav_tasks: 'പരിപാലന ചുമതലകൾ',
    nav_reminders: 'ഓർമ്മപ്പെടുത്തലുകൾ',
    nav_handover: 'ഷിഫ്റ്റ് കൈമാറ്റം',
    nav_history: 'പ്രവർത്തന ചരിത്രം',
    nav_training: 'LLM & പരിശീലനം',
    nav_voice: 'ശബ്ദവും ഭാഷകളും',
    nav_settings: 'ക്രമീകരണങ്ങൾ',

    greeting_morning: 'സുപ്രഭാതം',
    greeting_afternoon: 'ശുഭദിനം',
    greeting_evening: 'ശുഭസായാഹ്നം',
    coordinating_for: 'പരിപാലനം',
    primary_caregiver: 'പ്രധാന പരിചാരകൻ',
    search_placeholder: 'മരുന്നുകൾ, ചുമതലകൾ തിരയുക...',
    voice_assistant_btn: 'വോയ്സ് അസിസ്റ്റന്റ്',
    status_proactive_online: 'അസിസ്റ്റന്റ് സജീവം',

    assistant_name: 'എക്കോ കെയർ AI',
    assistant_title: 'ഞാൻ എക്കോ, നിങ്ങളുടെ AI അസിസ്റ്റന്റ്.',
    assistant_subtitle: 'നിങ്ങളുടെ ശബ്ദം. നിങ്ങളുടെ ഭാഷ. നിങ്ങളുടെ ബുദ്ധിമാനായ സഹായി.',
    briefing_title: 'ദിവസേനയുള്ള പരിചരണ വിവരണം',
    briefing_on_track: 'എലനോർ കൃത്യസമയത്താണ്',
    talk_to_assistant: 'എക്കോയോട് സംസാരിക്കൂ',
    prepare_handover: 'കൈമാറ്റ റിപ്പോർട്ട് തയ്യാറാക്കൂ',

    tap_to_speak: 'സംസാരിക്കാൻ ടാപ്പ് ചെയ്യുക',
    stop_listening: 'കേൾക്കുന്നത് നിർത്തൂ',
    listening_state: 'ഞാൻ കേൾക്കുന്നു...',
    thinking_state: 'ചിന്തിക്കുന്നു...',
    speaking_state: 'സംസാരിക്കുന്നു...',
    ready_state: 'തയ്യാറാണ് — സംസാരിക്കാൻ ടാപ്പ് ചെയ്യുക',
    repeat_btn: 'ആവർത്തിക്കുക',
    type_instead_btn: 'ടൈപ്പ് ചെയ്യുക',
    cheat_sheet_btn: 'കമാൻഡുകൾ',
    try_saying: 'ഇങ്ങനെ പറയൂ',
    prompt_today_tasks: 'ഇന്ന് എനിക്ക് എന്തൊക്കെ ചുമതലകൾ ഉണ്ട്?',
    prompt_reminder: 'വൈകുന്നേരം 6 മണിക്ക് അമ്മയെ വിളിക്കാൻ ഓർമ്മിപ്പിക്കുക',
    prompt_vitals: 'ഇന്നത്തെ രക്തസമ്മർദ്ദം എത്രയായിരുന്നു?',
    prompt_handover: 'നഴ്സ് ഡേവിഡിനുള്ള ഹാൻഡ്‌ഓവർ തയ്യാറാക്കുക',

    tasks_due_today: 'ഇന്നത്തെ ചുമതലകൾ',
    adherence_rate: 'പൂർത്തീകരണ നിരക്ക്',
    active_reminders: 'ഓർമ്മപ്പെടുത്തലുകൾ',
    on_target: 'ലക്ഷ്യത്തിൽ',
    scheduled: 'നിശ്ചയിച്ചവ',
    completed: 'പൂർത്തിയായി',
    pending: 'ബാക്കിയുള്ളവ',

    save: 'സൂക്ഷിക്കുക',
    cancel: 'റദ്ദാക്കുക',
    confirm: 'സ്ഥിരീകരിക്കുക',
    delete: 'നീക്കം ചെയ്യുക',
    view_all: 'എല്ലാം കാണുക',
    reset_demo: 'ഡെമോ പുനഃസജ്ജീകരിക്കുക',
    manage_reminders: 'ക്രമീകരിക്കുക'
  },

  te: {
    nav_overview: 'అవలోకనం',
    nav_assistant: 'వాయిస్ అసిస్టెంట్',
    nav_conversations: 'సంభాషణలు',
    nav_tasks: 'సంరక్షణ పనులు',
    nav_reminders: 'రిమైండర్లు',
    nav_handover: 'షిఫ్ట్ హ్యాండోవర్',
    nav_history: 'కార్యకలాపాల చరిత్ర',
    nav_training: 'LLM & శిక్షణ',
    nav_voice: 'వాయిస్ & భాషలు',
    nav_settings: 'సెట్టింగ్‌లు',

    greeting_morning: 'శుభోదయం',
    greeting_afternoon: 'శుభ మధ్యాహ్నం',
    greeting_evening: 'శుభ సాయంత్రం',
    coordinating_for: 'సంరక్షణ పొందుతున్న వారు',
    primary_caregiver: 'ప్రధాన సంరక్షకుడు',
    search_placeholder: 'పనులు, మందులు, రిమైండర్లను శోధించండి...',
    voice_assistant_btn: 'వాయిస్ అసిస్టెంట్',
    status_proactive_online: 'అసిస్టెంట్ ఆన్‌లైన్‌లో ఉంది',

    assistant_name: 'ఎకోకేర్ AI',
    assistant_title: 'నేను ఎకో, మీ AI సహాయకుడిని.',
    assistant_subtitle: 'మీ వాయిస్. మీ భాష. మీ తెలివైన సహాయకుడు.',
    briefing_title: 'రోజువారీ సంరక్షణ నివేదిక',
    briefing_on_track: 'ఎలినోర్ ఈ రోజు సరైన సమయానికి ఉన్నారు',
    talk_to_assistant: 'ఎకోతో మాట్లాడండి',
    prepare_handover: 'హ్యాండోవర్ సిద్ధం చేయండి',

    tap_to_speak: 'మాట్లాడటానికి నొక్కండి',
    stop_listening: 'వినడం ఆపండి',
    listening_state: 'నేను వింటున్నాను...',
    thinking_state: 'ఆలోచిస్తున్నాను...',
    speaking_state: 'మాట్లాడుతున్నాను...',
    ready_state: 'సిద్ధంగా ఉంది — మాట్లాడటానికి నొక్కండి',
    repeat_btn: 'పునరావృతం చేయండి',
    type_instead_btn: 'టైప్ చేయండి',
    cheat_sheet_btn: 'వాయిస్ ఆదేశాలు',
    try_saying: 'ఇలా ప్రయత్నించండి',
    prompt_today_tasks: 'ఈ రోజు నేను ఏ పనులు చేయాలి?',
    prompt_reminder: 'సాయంత్రం 6 గంటలకు అమ్మకు కాల్ చేయాలని గుర్తు చేయండి',
    prompt_vitals: 'ఈ రోజు ఎలినోర్ రక్తపోటు ఎంత?',
    prompt_handover: 'నర్సు డేవిడ్ కోసం హ్యాండోవర్ నివేదిక తయారు చేయండి',

    tasks_due_today: 'ఈ రోజు పనులు',
    adherence_rate: 'పూర్తి శాతం',
    active_reminders: 'యాక్టివ్ రిమైండర్లు',
    on_target: 'సరైన మార్గంలో',
    scheduled: 'షెడ్యూల్ చేయబడింది',
    completed: 'పూర్తయింది',
    pending: 'పెండింగ్‌లో ఉంది',

    save: 'సేవ్ చేయండి',
    cancel: 'రద్దు చేయండి',
    confirm: 'నిర్ధారించండి',
    delete: 'తొలగించండి',
    view_all: 'అన్నీ చూడండి',
    reset_demo: 'డెమో రీసెట్ చేయండి',
    manage_reminders: 'రిమైండర్లను నిర్వహించండి'
  },

  kn: {
    nav_overview: 'ಅವಲೋಕನ',
    nav_assistant: 'ಧ್ವನಿ ಸಹಾಯಕ',
    nav_conversations: 'ಸಂಭಾಷಣೆಗಳು',
    nav_tasks: 'ಆರೈಕೆ ಕಾರ್ಯಗಳು',
    nav_reminders: 'ಜ್ಞಾಪನೆಗಳು',
    nav_handover: 'ಪಾಳಿ ಹಸ್ತಾಂತರ',
    nav_history: 'ಚಟುವಟಿಕೆ ಇತಿಹಾಸ',
    nav_training: 'LLM ಮತ್ತು ತರಬೇತಿ',
    nav_voice: 'ಧ್ವನಿ ಮತ್ತು ಭಾಷೆಗಳು',
    nav_settings: 'ಸೆಟ್ಟಿಂಗ್‌ಗಳು',

    greeting_morning: 'ಶುಭೋದಯ',
    greeting_afternoon: 'ಶುಭ ಮಧ್ಯಾಹ್ನ',
    greeting_evening: 'ಶುಭ ಸಂಜೆ',
    coordinating_for: 'ಆರೈಕೆ ಪಡೆಯುವವರು',
    primary_caregiver: 'ಮುಖ್ಯ ಆರೈಕೆದಾರ',
    search_placeholder: 'ಕಾರ್ಯಗಳು, ಔಷಧಿಗಳು, ಜ್ಞಾಪನೆಗಳನ್ನು ಹುಡುಕಿ...',
    voice_assistant_btn: 'ಧ್ವನಿ ಸಹಾಯಕ',
    status_proactive_online: 'ಸಹಾಯಕ ಆನ್‌ಲೈನ್‌ನಲ್ಲಿದೆ',

    assistant_name: 'ಎಕೋಕೇರ್ AI',
    assistant_title: 'ನಾನು ಎಕೋ, ನಿಮ್ಮ AI ಸಹಾಯಕ.',
    assistant_subtitle: 'ನಿಮ್ಮ ಧ್ವನಿ. ನಿಮ್ಮ ಭಾಷೆ. ನಿಮ್ಮ ಬುದ್ಧಿವಂತ ಸಹಾಯಕ.',
    briefing_title: 'ದೈನಂದಿನ ಆರೈಕೆ ವಿವರಣೆ',
    briefing_on_track: 'ಎಲಿನೋರ್ ಇಂದು ಸರಿಯಾದ ವೇಳಾಪಟ್ಟಿಯಲ್ಲಿದ್ದಾರೆ',
    talk_to_assistant: 'ಎಕೋ ಜೊತೆ ಮಾತನಾಡಿ',
    prepare_handover: 'ಹಸ್ತಾಂತರ ಸಿದ್ಧಪಡಿಸಿ',

    tap_to_speak: 'ಮಾತನಾಡಲು ಒತ್ತಿರಿ',
    stop_listening: 'ಕೇಳುವುದನ್ನು ನಿಲ್ಲಿಸಿ',
    listening_state: 'ನಾನು ಕೇಳುತ್ತಿದ್ದೇನೆ...',
    thinking_state: 'ಯೋಚಿಸುತ್ತಿದ್ದೇನೆ...',
    speaking_state: 'ಮಾತನಾಡುತ್ತಿದ್ದೇನೆ...',
    ready_state: 'ಸಿದ್ಧವಾಗಿದೆ — ಮಾತನಾಡಲು ಒತ್ತಿರಿ',
    repeat_btn: 'ಮತ್ತೆ ಹೇಳಿ',
    type_instead_btn: 'ಟೈಪ್ ಮಾಡಿ',
    cheat_sheet_btn: 'ಆದೇಶಗಳು',
    try_saying: 'ಹೀಗೆ ಹೇಳಿ ನೋಡಿ',
    prompt_today_tasks: 'ಇಂದು ನಾನು ಏನು ಮಾಡಬೇಕು?',
    prompt_reminder: 'ಸಂಜೆ 6 ಗಂಟೆಗೆ ಅಮ್ಮನಿಗೆ ಕರೆ ಮಾಡಲು ನೆನಪಿಸಿ',
    prompt_vitals: 'ಇಂದು ಎಲಿನೋರ್ ಅವರ ರಕ್ತದೊತ್ತಡ ಎಷ್ಟಿತ್ತು?',
    prompt_handover: 'ನರ್ಸ್ ಡೇವಿಡ್‌ಗೆ ಹಸ್ತಾಂತರ ವರದಿ ಸಿದ್ಧಪಡಿಸಿ',

    tasks_due_today: 'ಇಂದಿನ ಕಾರ್ಯಗಳು',
    adherence_rate: 'ಪೂರ್ಣಗೊಳಿಸುವಿಕೆ ದರ',
    active_reminders: 'ಸಕ್ರಿಯ ಜ್ಞಾಪನೆಗಳು',
    on_target: 'ಗುರಿಯಲ್ಲಿದೆ',
    scheduled: 'ನಿಗದಿಯಾಗಿದೆ',
    completed: 'ಮುಗಿದಿದೆ',
    pending: 'ಬಾಕಿ ಇದೆ',

    save: 'ಉಳಿಸಿ',
    cancel: 'ರದ್ದುಮಾಡಿ',
    confirm: 'ದೃಢೀಕರಿಸಿ',
    delete: 'ಅಳಿಸಿ',
    view_all: 'ಎಲ್ಲವನ್ನೂ ವೀಕ್ಷಿಸಿ',
    reset_demo: 'ಡೆಮೊ ಮರುಹೊಂದಿಸಿ',
    manage_reminders: 'ಜ್ಞಾಪನೆಗಳನ್ನು ನಿರ್ವಹಿಸಿ'
  }
};

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (key: string) => string;
  currentLangInfo: LanguageInfo;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key: string) => key,
  currentLangInfo: SUPPORTED_LANGUAGES[0]
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<SupportedLanguage>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('echocare_lang') as SupportedLanguage;
      if (saved && TRANSLATIONS[saved]) return saved;
    }
    return 'en';
  });

  const setLanguage = (lang: SupportedLanguage) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('echocare_lang', lang);
    }
  };

  const t = (key: string): string => {
    const dict = TRANSLATIONS[language] || TRANSLATIONS.en;
    if (dict && dict[key]) return dict[key];
    return TRANSLATIONS.en[key] || key;
  };

  const currentLangInfo = SUPPORTED_LANGUAGES.find(l => l.code === language) || SUPPORTED_LANGUAGES[0];

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, currentLangInfo }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
