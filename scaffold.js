const fs = require('fs');
const path = require('path');

const generateReactComponent = (title) => `import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

const ${title} = () => {
  const { t } = useLanguage();
  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-6">{t("${title.replace(/([A-Z])/g, ' $1').trim()}")}</h1>
      <div className="bg-slate-800/80 backdrop-blur-md p-6 rounded-xl border border-slate-700 text-slate-300">
        <p>This page is fully accessible. Replace with real ${title} logic.</p>
      </div>
    </div>
  );
};

export default ${title};
`;

const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

const adminPages = ['Buses', 'Drivers', 'Routes', 'Stops', 'Users', 'Trips', 'Alerts', 'Notifications', 'Settings'];
const driverPages = ['LiveTrip', 'History', 'Profile'];

const adminDir = path.join(__dirname, 'frontend/src/pages/Admin');
const driverDir = path.join(__dirname, 'frontend/src/pages/Driver');

ensureDir(adminDir);
ensureDir(driverDir);

adminPages.forEach(page => {
  const filePath = path.join(adminDir, `${page}.jsx`);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, generateReactComponent(page));
  }
});

driverPages.forEach(page => {
  const filePath = path.join(driverDir, `${page}.jsx`);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, generateReactComponent(page));
  }
});

console.log('Scaffolded all missing admin and driver pages.');
