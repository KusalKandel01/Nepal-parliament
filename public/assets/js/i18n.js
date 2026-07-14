/* ============================================================
   i18n.js — first-party Nepali/English UI strings.
   Built so the site never needs Google Translate: browser
   auto-translate was mangling single characters (avatar
   initials, alphabet filter letters) and even mistranslating
   real members' names. This dictionary covers the UI chrome;
   member data (names, districts, parties) is unaffected and
   always shown in both scripts via name_ne/name_en fields.
   ============================================================ */

const I18N = {
  ne: {
    nav_home: "गृहपृष्ठ", nav_directory: "सदस्य निर्देशिका", nav_leadership: "नेतृत्व",
    nav_committees: "समितिहरू", nav_statistics: "तथ्याङ्क", nav_downloads: "डाउनलोड", nav_about: "बारेमा",
    footer_rights: "संघीय संसद सचिवालय — Federal Parliament Secretariat, Singha Durbar, Kathmandu",

    home_title: "संसद सदस्यहरूको सम्पर्क जानकारी खोज्नुहोस्",
    home_lede: "प्रतिनिधि सभा र राष्ट्रिय सभाका ३३२ माननीय सदस्यहरूको फोन, इमेल र निर्वाचन क्षेत्र सम्बन्धी विवरण — एकै ठाउँमा।",
    search_placeholder: "नाम, जिल्ला, दल, फोन वा इमेल खोज्नुहोस्…",
    stat_total: "कुल सदस्य", stat_hor: "प्रतिनिधि सभा", stat_na: "राष्ट्रिय सभा", stat_parties: "राजनीतिक दलहरू", stat_found: "फेला परेको",
    card_directory_title: "सदस्य निर्देशिका", card_directory_desc: "खोज, दल अनुसार फिल्टर, र वर्णानुक्रम अनुसार सबै ३३२ सदस्यहरू हेर्नुहोस्।",
    card_leadership_title: "नेतृत्व", card_leadership_desc: "सभामुख, उपसभामुख, अध्यक्ष, उपाध्यक्ष र प्रधानमन्त्रीको सम्पर्क कार्यालय।",
    card_committees_title: "समितिहरू", card_committees_desc: "प्रतिनिधि सभा र राष्ट्रिय सभा अन्तर्गतका सबै विषयगत समितिहरू।",
    card_statistics_title: "तथ्याङ्क", card_statistics_desc: "दलगत, सदनगत र जिल्लागत सदस्य विभाजन इन्टरएक्टिभ चार्टमा।",
    card_downloads_title: "डाउनलोड", card_downloads_desc: "पूर्ण डाटा CSV र JSON ढाँचामा नि:शुल्क डाउनलोड गर्नुहोस्।",
    card_about_title: "बारेमा", card_about_desc: "यो निर्देशिका कसरी बनाइयो र डाटाको स्रोत/भरपर्दोपनाको बारेमा जान्नुहोस्।",

    directory_title: "सदस्य निर्देशिका",
    directory_lede: "नाम, जिल्ला, राजनीतिक दल, फोन वा इमेलद्वारा खोज्नुहोस्। नतिजाहरू स्वतः फिल्टर हुन्छन्।",
    all_parties: "सबै दल", all: "सबै", all_short: "सबै",
    house_all: "सबै", house_hor: "प्रतिनिधि सभा", house_na: "राष्ट्रिय सभा",
    sort_name_asc: "नाम (क-ज्ञ)", sort_name_desc: "नाम (ज्ञ-क)", sort_district: "जिल्ला अनुसार",
    sort_party: "दल अनुसार", sort_house: "सदन अनुसार",
    showing_all: "जम्मा", showing_of: "सदस्यहरू फेला परे, जम्मा", showing_members: "सदस्यहरू देखाइँदै",
    no_results_title: "कुनै सदस्य फेला परेन", no_results_sub: "खोज वा फिल्टर मापदण्ड परिवर्तन गरी पुनः प्रयास गर्नुहोस्",
    clear_filters: "सबै फिल्टर हटाउनुहोस्",
    phone_unavailable: "फोन उपलब्ध छैन", email_unavailable: "इमेल उपलब्ध छैन", district_unspecified: "उल्लेख नभएको",
    tooltip_whatsapp: "WhatsApp", tooltip_copy: "फोन/इमेल कपी", tooltip_vcard: "vCard डाउनलोड",
    tooltip_save: "साभार गर्नुहोस्", tooltip_saved: "साभार गरिएको", tooltip_profile: "पूर्ण प्रोफाइल",
    page_prev: "अघिल्लो", page_next: "अर्को",
    lang_toggle_label: "भाषा बदल्नुहोस्",
    suggest_no_match: "कुनै मिल्दो नतिजा फेला परेन — Enter थिचेर पूर्ण खोज हेर्नुहोस्",
    suggest_view_all: '"{q}" को लागि सबै नतिजा हेर्नुहोस् →',

    back: "फर्कनुहोस्", loading: "लोड हुँदैछ…",
    profile_house: "सदन", profile_district: "जिल्ला / प्रदेश", profile_phone: "फोन नम्बर",
    profile_email: "इमेल", profile_id: "सदस्य ID", profile_party_code: "दल कोड",
    profile_committee_chair: "सभापतित्व गरेको समिति",
    action_whatsapp: "WhatsApp", action_vcard: "vCard डाउनलोड", action_copy: "सम्पर्क कपी",
    action_share: "साझा गर्नुहोस्", action_print: "प्रिन्ट", action_report: "त्रुटि सूचित गर्नुहोस्",
    contact_details: "सम्पर्क विवरण", link_label: "लिङ्क",
    member_no_id: "कुनै सदस्य ID दिइएको छैन। कृपया निर्देशिकाबाट कुनै सदस्य छान्नुहोस्।",
    member_load_failed: "डाटा लोड गर्न असफल भयो।", retry: "पुनः प्रयास गर्नुहोस्",
    member_not_found: "सदस्य फेला परेन। यो ID अवस्थित छैन:",
    view_full_directory: "सम्पूर्ण निर्देशिका हेर्नुहोस् →",
    load_failed: "लोड गर्न असफल भयो। पृष्ठ पुनः लोड गर्नुहोस्।",
    office_phone_unavailable: "कार्यालय फोन उपलब्ध छैन", needs_review: "⚠ स्रोत पुष्टि हुन बाँकी",
    government: "सरकार",
    th_party: "दल", th_parl_office: "संसदीय दलको कार्यालय", th_staff_office: "कर्मचारी कार्यकक्ष",
    committees_no_match: "यस श्रेणीमा कुनै समिति फेला परेन",
    committee_chair_role: "सभापति", committee_secretary_role: "सचिव", committee_email_role: "इमेल",
    stats_load_failed: "तथ्याङ्क लोड गर्न असफल भयो। पृष्ठ पुनः लोड गर्नुहोस्।",
    chart_party_title: "दल अनुसार विभाजन", chart_house_title: "सदन अनुसार विभाजन",
    chart_district_title: "शीर्ष जिल्ला/प्रदेश (सदस्य संख्या अनुसार)", chart_completeness_title: "डाटा पूर्णता",
    completeness_phone_available: "फोन उपलब्ध", completeness_phone_missing: "फोन अनुपलब्ध",
    completeness_email_available: "इमेल उपलब्ध", completeness_photo_available: "फोटो उपलब्ध",
    missing_phone_note: "सदस्यको फोन नम्बर स्रोत डाइरेक्ट्रीमा नै उपलब्ध थिएन (अनुमान गरिएको छैन)।",
    download_btn: "डाउनलोड", downloaded_toast: "डाउनलोड भयो", download_failed_toast: "डाउनलोड असफल भयो",
    last_updated: "अन्तिम अद्यावधिक", data_version_label: "डाटा संस्करण",
    page_leadership_title: "नेतृत्व", page_leadership_lede: "संघीय संसदको नेतृत्व तहका पदाधिकारीहरूको आधिकारिक कार्यालय सम्पर्क विवरण।",
    party_offices_heading: "राजनीतिक दलहरूको संसदीय कार्यालय",
    party_offices_caption: "दल अनुसार संसदीय तथा कर्मचारी कार्यालय फोन नम्बरहरू",
    page_committees_title: "समितिहरू", page_committees_lede: "संघीय संसद अन्तर्गतका विषयगत समितिहरूको सभापति, सचिव र कार्यालय सम्पर्क।",
    tab_all: "सबै", tab_hor: "प्रतिनिधि सभा", tab_na: "राष्ट्रिय सभा", tab_joint: "संयुक्त समिति",
    page_statistics_title: "तथ्याङ्क", page_statistics_lede: "संघीय संसदको दलगत, सदनगत र जिल्लागत सदस्य विभाजन।",
    page_downloads_title: "डाउनलोड", page_downloads_lede: "पूर्ण डाटासेट खुला ढाँचामा नि:शुल्क डाउनलोड गर्नुहोस् — अनुसन्धान, पत्रकारिता वा नागरिक प्रविधि परियोजनाहरूका लागि।",
    page_about_title: "यो निर्देशिकाको बारेमा", page_about_lede: "पारदर्शिता हाम्रो प्राथमिकता हो — डाटा कसरी संकलन र प्रशोधन गरियो भन्ने पूर्ण विवरण।",

    hero_eyebrow: "३३२ सिट · २ सदन · १ सभाहल",
    hero_lede: "नेपालको संघीय संसदको पूर्ण, क्रस-भेरिफाइड सम्पर्क निर्देशिका — प्रतिनिधि सभा र राष्ट्रिय सभा। कुनै पनि सदस्य खोज्नुहोस्, तिनको कार्यालयमा फोन गर्नुहोस्, वा तल सभाहल ठ्याक्कै बसेको अवस्थामा नै अन्वेषण गर्नुहोस्।",
    hero_open_directory: "पूर्ण निर्देशिका खोल्नुहोस् →",
    hero_download_csv_json: "CSV / JSON डाउनलोड गर्नुहोस्",
    chamber_caption: "तपाईं सभाहल भित्र उभिनुभएको छ। हेर्न तान्नुहोस् · कसले बसेको हेर्न कुनै सिटमा माउस लैजानुहोस् · प्रोफाइल खोल्न क्लिक गर्नुहोस्।",
    legend_other: "अन्य",
    stat_committees: "संसदीय समितिहरू",
    section_composition_eyebrow: "संरचना",
    section_composition_title: "सभाहलमा कसको बाहुल्य छ",
    section_composition_lede: "प्रतिनिधि सभा र राष्ट्रिय सभा मिलाई सबै ३३२ सिटमा हरेक दलको हिस्सा।",
    section_leadership_title: "सभामुख, उपसभामुख र सभाहल अध्यक्षहरू",
    section_leadership_lede: "संघीय संसदका पाँच नेतृत्व सिटका प्रत्यक्ष कार्यालय फोन लाइनहरू।",
    closing_eyebrow: "१६ समिति · १० दल कार्यालय",
    closing_title: "पूरै संस्थासम्म पुग्नुहोस्, केवल सूचीमा मात्र होइन।",
    closing_browse_committees: "समितिहरू हेर्नुहोस् →",
    closing_how_verified: "यो डाटा कसरी प्रमाणित गरियो",
    home_footer: "संघीय संसद सचिवालय, सिंहदरबार, काठमाडौं · hr.parliament.gov.np र na.parliament.gov.np सँग क्रस-रेफरेन्स गरिएको डाटा · स्वतन्त्र नागरिक-प्रविधि परियोजना",
  },
  en: {
    nav_home: "Home", nav_directory: "Member Directory", nav_leadership: "Leadership",
    nav_committees: "Committees", nav_statistics: "Statistics", nav_downloads: "Downloads", nav_about: "About",
    footer_rights: "Federal Parliament Secretariat, Singha Durbar, Kathmandu",

    home_title: "Find contact information for members of parliament",
    home_lede: "Phone, email, and constituency details of 332 honourable members of the House of Representatives and the National Assembly — in one place.",
    search_placeholder: "Search by name, district, party, phone or email…",
    stat_total: "Total members", stat_hor: "House of Representatives", stat_na: "National Assembly", stat_parties: "Political parties", stat_found: "Found",
    card_directory_title: "Member Directory", card_directory_desc: "Search, filter by party, and browse all 332 members alphabetically.",
    card_leadership_title: "Leadership", card_leadership_desc: "Contact offices of the Speaker, Deputy Speaker, Chairperson, Vice Chairperson, and Prime Minister.",
    card_committees_title: "Committees", card_committees_desc: "All thematic committees under the House of Representatives and National Assembly.",
    card_statistics_title: "Statistics", card_statistics_desc: "Interactive charts of member distribution by party, house, and district.",
    card_downloads_title: "Downloads", card_downloads_desc: "Download the full dataset in CSV and JSON format, free of charge.",
    card_about_title: "About", card_about_desc: "Learn how this directory was built and about the source and reliability of the data.",

    directory_title: "Member Directory",
    directory_lede: "Search by name, district, political party, phone or email. Results are filtered automatically.",
    all_parties: "All parties", all: "All", all_short: "All",
    house_all: "All", house_hor: "House of Representatives", house_na: "National Assembly",
    sort_name_asc: "Name (A–Z)", sort_name_desc: "Name (Z–A)", sort_district: "By district",
    sort_party: "By party", sort_house: "By house",
    showing_all: "Showing all", showing_of: "members found, out of", showing_members: "members",
    no_results_title: "No members found", no_results_sub: "Try adjusting your search or filter criteria",
    clear_filters: "Clear all filters",
    phone_unavailable: "Phone not available", email_unavailable: "Email not available", district_unspecified: "Not specified",
    tooltip_whatsapp: "WhatsApp", tooltip_copy: "Copy phone/email", tooltip_vcard: "Download vCard",
    tooltip_save: "Save", tooltip_saved: "Saved", tooltip_profile: "Full profile",
    page_prev: "Previous", page_next: "Next",
    lang_toggle_label: "Change language",
    suggest_no_match: "No matches found — press Enter for a full search",
    suggest_view_all: 'View all results for "{q}" →',

    back: "Back", loading: "Loading…",
    profile_house: "House", profile_district: "District / Province", profile_phone: "Phone number",
    profile_email: "Email", profile_id: "Member ID", profile_party_code: "Party code",
    profile_committee_chair: "Chairs committee",
    action_whatsapp: "WhatsApp", action_vcard: "Download vCard", action_copy: "Copy contact",
    action_share: "Share", action_print: "Print", action_report: "Report an error",
    contact_details: "Contact details", link_label: "Link",
    member_no_id: "No member ID was given. Please choose a member from the directory.",
    member_load_failed: "Failed to load data.", retry: "Try again",
    member_not_found: "Member not found. This ID does not exist:",
    view_full_directory: "View the full directory →",
    load_failed: "Failed to load. Please reload the page.",
    office_phone_unavailable: "Office phone not available", needs_review: "⚠ Source needs verification",
    government: "Government",
    th_party: "Party", th_parl_office: "Parliamentary party office", th_staff_office: "Staff office",
    committees_no_match: "No committees found in this category",
    committee_chair_role: "Chairperson", committee_secretary_role: "Secretary", committee_email_role: "Email",
    stats_load_failed: "Failed to load statistics. Please reload the page.",
    chart_party_title: "Distribution by party", chart_house_title: "Distribution by house",
    chart_district_title: "Top districts/provinces (by member count)", chart_completeness_title: "Data completeness",
    completeness_phone_available: "Phone available", completeness_phone_missing: "Phone missing",
    completeness_email_available: "Email available", completeness_photo_available: "Photo available",
    missing_phone_note: "members had no phone number on file in the source directory (not guessed).",
    download_btn: "Download", downloaded_toast: "downloaded", download_failed_toast: "Download failed",
    last_updated: "Last updated", data_version_label: "Data version",
    page_leadership_title: "Leadership", page_leadership_lede: "Official office contact details of the leadership-level officials of the Federal Parliament.",
    party_offices_heading: "Parliamentary offices of political parties",
    party_offices_caption: "Parliamentary and staff office phone numbers by party",
    page_committees_title: "Committees", page_committees_lede: "Chairperson, secretary, and office contact for the Federal Parliament's thematic committees.",
    tab_all: "All", tab_hor: "House of Representatives", tab_na: "National Assembly", tab_joint: "Joint committee",
    page_statistics_title: "Statistics", page_statistics_lede: "Member distribution of the Federal Parliament by party, house, and district.",
    page_downloads_title: "Downloads", page_downloads_lede: "Download the full dataset in an open format, free of charge — for research, journalism, or civic-tech projects.",
    page_about_title: "About this directory", page_about_lede: "Transparency is our priority — full details on how the data was collected and processed.",

    hero_eyebrow: "332 seats · 2 houses · 1 chamber",
    hero_lede: "The complete, cross-verified contact directory of Nepal's Federal Parliament — House of Representatives and National Assembly. Search any member, call their office, or explore the chamber below exactly as it's seated.",
    hero_open_directory: "Open full directory →",
    hero_download_csv_json: "Download CSV / JSON",
    chamber_caption: "You're standing inside the chamber. Drag to look around · hover any seat to see who sits there · click to open their profile.",
    legend_other: "Other",
    stat_committees: "Parliamentary committees",
    section_composition_eyebrow: "Composition",
    section_composition_title: "Who holds the chamber",
    section_composition_lede: "Every party's share of all 332 seats, House and National Assembly combined.",
    section_leadership_title: "Speaker, Deputy Speaker & chamber chairs",
    section_leadership_lede: "Direct office lines for the five leadership seats of the Federal Parliament.",
    closing_eyebrow: "16 committees · 10 party offices",
    closing_title: "Reach the whole institution, not just the roster.",
    closing_browse_committees: "Browse committees →",
    closing_how_verified: "How this data was verified",
    home_footer: "Federal Parliament Secretariat, Singha Durbar, Kathmandu · Data cross-referenced with hr.parliament.gov.np & na.parliament.gov.np · Independent civic-tech project",
  }
};

(function () {
  function getLang() {
    return localStorage.getItem("npd-lang") || "ne";
  }
  function setLang(lang) {
    localStorage.setItem("npd-lang", lang);
    document.documentElement.setAttribute("lang", lang === "en" ? "en" : "ne");
  }
  function t(key) {
    const lang = getLang();
    return (I18N[lang] && I18N[lang][key]) || I18N.ne[key] || key;
  }
  // Apply data-i18n="key" text content + data-i18n-placeholder="key" on load.
  function applyStatic(root = document) {
    root.querySelectorAll("[data-i18n]").forEach(el => {
      el.textContent = t(el.getAttribute("data-i18n"));
    });
    root.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
      el.setAttribute("placeholder", t(el.getAttribute("data-i18n-placeholder")));
    });
    root.querySelectorAll("[data-i18n-aria-label]").forEach(el => {
      el.setAttribute("aria-label", t(el.getAttribute("data-i18n-aria-label")));
    });
  }
  window.I18N_ENGINE = { getLang, setLang, t, applyStatic };
})();
