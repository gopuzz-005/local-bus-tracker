import React, { createContext, useState, useContext } from 'react';

const LanguageContext = createContext();

const translations = {
  English: {
    "Find Bus": "Find Bus",
    "Starting Stop": "Starting Stop",
    "Destination": "Destination",
    "Nearby Stops": "Nearby Stops",
    "Favorites": "Favorites",
    "Alerts": "Alerts",
    "Notifications": "Notifications",
    "Trip History": "Trip History",
    "Current Stop": "Current Stop",
    "Next Stop": "Next Stop",
    "Stops Remaining": "Stops Remaining",
    "ETA": "ETA",
    "Share Route": "Share Route",
    "Logout": "Logout",
    "Dashboard": "Dashboard",
    "Live Trip": "Live Trip",
    "History": "History",
    "Profile": "Profile",
    "Tracker": "Tracker",
    "Buses": "Buses",
    "Drivers": "Drivers",
    "Routes": "Routes",
    "Stops": "Stops",
    "Users": "Users",
    "Trips": "Trips",
    "Settings": "Settings",
    "Signout": "Signout",
    "Start Trip": "Start Trip",
    "End Trip": "End Trip",
    "Pause Trip": "Pause Trip",
    "Resume Trip": "Resume Trip",
    "Language": "Language"
  },
  Tamil: {
    "Find Bus": "பேருந்து தேடு",
    "Starting Stop": "புறப்படும் இடம்",
    "Destination": "செல்லும் இடம்",
    "Nearby Stops": "அருகிலுள்ள நிறுத்தங்கள்",
    "Favorites": "விருப்பமானவை",
    "Alerts": "எச்சரிக்கைகள்",
    "Notifications": "அறிவிப்புகள்",
    "Trip History": "பயண வரலாறு",
    "Current Stop": "தற்போதைய நிறுத்தம்",
    "Next Stop": "அடுத்த நிறுத்தம்",
    "Stops Remaining": "மீதமுள்ள நிறுத்தங்கள்",
    "ETA": "மதிப்பிடப்பட்ட நேரம்",
    "Share Route": "வழி பகிர்",
    "Logout": "வெளியேறு",
    "Dashboard": "டாஷ்போர்டு",
    "Live Trip": "நேரடி பயணம்",
    "History": "வரலாறு",
    "Profile": "சுயவிவரம்",
    "Tracker": "கண்காணிப்பான்",
    "Buses": "பேருந்துகள்",
    "Drivers": "ஓட்டுநர்கள்",
    "Routes": "வழித்தடங்கள்",
    "Stops": "நிறுத்தங்கள்",
    "Users": "பயனர்கள்",
    "Trips": "பயணங்கள்",
    "Settings": "அமைப்புகள்",
    "Signout": "வெளியேறு",
    "Start Trip": "பயணத்தை தொடங்கு",
    "End Trip": "பயணத்தை முடி",
    "Pause Trip": "பயணத்தை இடைநிறுத்து",
    "Resume Trip": "பயணத்தை மீண்டும் தொடங்கு",
    "Language": "மொழி"
  },
  Malayalam: {
    "Find Bus": "ബസ്സ് തിരയുക",
    "Starting Stop": "പുറപ്പെടുന്ന സ്ഥലം",
    "Destination": "ലക്ഷ്യസ്ഥാനം",
    "Nearby Stops": "അടുത്തുള്ള സ്റ്റോപ്പുകൾ",
    "Favorites": "പ്രിയപ്പെട്ടവ",
    "Alerts": "മുന്നറിയിപ്പുകൾ",
    "Notifications": "അറിയിപ്പുകൾ",
    "Trip History": "യാത്രാ ചരിത്രം",
    "Current Stop": "നിലവിലെ സ്റ്റോപ്പ്",
    "Next Stop": "അടുത്ത സ്റ്റോപ്പ്",
    "Stops Remaining": "ശേഷിക്കുന്ന സ്റ്റോപ്പുകൾ",
    "ETA": "എത്തിച്ചേരുന്ന സമയം",
    "Share Route": "റൂട്ട് പങ്കിടുക",
    "Logout": "പുറത്തുകടക്കുക",
    "Dashboard": "ഡാഷ്‌ബോർഡ്",
    "Live Trip": "ലൈവ് യാത്ര",
    "History": "ചരിത്രം",
    "Profile": "പ്രൊഫൈൽ",
    "Tracker": "ട്രാക്കർ",
    "Buses": "ബസുകൾ",
    "Drivers": "ഡ്രൈവർമാർ",
    "Routes": "റൂട്ടുകൾ",
    "Stops": "സ്റ്റോപ്പുകൾ",
    "Users": "ഉപയോക്താക്കൾ",
    "Trips": "യാത്രകൾ",
    "Settings": "ക്രമീകരണങ്ങൾ",
    "Signout": "പുറത്തുകടക്കുക",
    "Start Trip": "യാത്ര ആരംഭിക്കുക",
    "End Trip": "യാത്ര അവസാനിപ്പിക്കുക",
    "Pause Trip": "യാത്ര നിർത്തിവെക്കുക",
    "Resume Trip": "യാത്ര തുടരുക",
    "Language": "ഭാഷ"
  }
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(localStorage.getItem('appLang') || 'English');

  const changeLanguage = (lang) => {
    setLanguage(lang);
    localStorage.setItem('appLang', lang);
  };

  const t = (key) => {
    return translations[language]?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
