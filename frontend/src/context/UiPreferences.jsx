import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const translations = {
  ur: {
    dashboard:'ڈیش بورڈ', purchases:'خریداری', production:'پروڈکشن', sales:'فروخت',
    consumption:'استعمال', accounts:'اکاؤنٹس', stock:'اسٹاک', appendix:'اپینڈکس',
    expenses:'اخراجات', settings:'سیٹنگز', products:'مصنوعات', openingData:'ابتدائی ڈیٹا',
    customers:'گاہک', sources:'ذرائع', wheatPurchase:'گندم خریداری', bardanaPurchase:'باردانہ خریداری',
    appearance:'ظاہری شکل', theme:'تھیم', light:'لائٹ', dark:'ڈارک', language:'زبان',
    english:'English', urdu:'اردو', save:'محفوظ کریں', date:'تاریخ', source:'ذریعہ',
    product:'مصنوعہ', quantity:'مقدار', remarks:'تفصیل', optional:'اختیاری', reason:'وجہ',
    home:'گھر', companyUse:'مل / کمپنی استعمال', donation:'عطیہ', other:'دیگر',
    recentStockOut:'حالیہ استعمال', newStockOut:'نیا استعمال', saveStockOut:'محفوظ کریں',
    customerAccounts:'گاہک اکاؤنٹس', sourceAccounts:'ذریعہ اکاؤنٹس', addCustomer:'گاہک شامل کریں',
    addSource:'ذریعہ شامل کریں', name:'نام', phone:'فون', address:'پتہ', type:'قسم',
    private:'پرائیویٹ', government:'سرکاری', purchased:'خریداری', paid:'ادا شدہ', balance:'بقایا',
    search:'تلاش', monthlyWheatSummary:'ماہانہ گندم خلاصہ', opening:'اوپننگ', in:'ان', out:'آؤٹ',
    closing:'کلوزنگ', bardanaStock:'باردانہ اسٹاک', totalReceived:'کل موصول', used:'استعمال شدہ',
    current:'موجودہ', dailyStock:'روزانہ اسٹاک', monthlyProductStock:'ماہانہ مصنوعات اسٹاک',
    dailyRecord:'روزانہ ریکارڈ', wheatUsed:'استعمال شدہ گندم', totalProductsProduced:'کل پیداوار',
    currentWheat:'موجودہ گندم', producedKg:'پیدا شدہ کلو', productionPercent:'پروڈکشن فیصد',
    closingStockKg:'کلوزنگ اسٹاک کلو', closingBags:'کلوزنگ بیگز', total:'کل',
    monthlyExpenseSummary:'ماہانہ اخراجات خلاصہ', wheatPurchases:'گندم خریداری',
    bardanaPurchases:'باردانہ خریداری', otherExpenses:'دیگر اخراجات', totalExpenses:'کل اخراجات',
    addOtherExpense:'دیگر خرچ شامل کریں', editOtherExpense:'خرچ میں ترمیم', category:'کیٹیگری',
    amount:'رقم', note:'نوٹ', addExpense:'خرچ شامل کریں', saveChanges:'تبدیلیاں محفوظ کریں',
    automaticPurchaseExpenses:'خودکار خریداری اخراجات', selectCategory:'کیٹیگری منتخب کریں',
    customCategory:'ایک بار / کسٹم کیٹیگری', categoryName:'کیٹیگری نام',
    electricityBill:'بجلی بل', meal:'کھانا', employeeSalaries:'ملازمین کی تنخواہیں',
    machineryCost:'مشینری خرچ', purchaseHistory:'خریداری تاریخ', showAll:'سب دکھائیں',
    wheat:'گندم', bardana:'باردانہ', wheatCost:'گندم لاگت', bardanaCost:'باردانہ لاگت',
    totalPurchase:'کل خریداری', rate:'ریٹ', salesHistory:'فروخت تاریخ', totalSales:'کل فروخت',
    received:'موصول', pending:'بقایا', bills:'بل', billNo:'بل نمبر', customer:'گاہک',
    bagSize:'بیگ سائز', bags:'بیگز', totalKg:'کل کلو', ratePerBag:'فی بیگ ریٹ',
    addItem:'آئٹم شامل کریں', amountReceived:'موصول رقم', pendingThisBill:'اس بل کا بقایا',
    saveSale:'فروخت محفوظ کریں', viewPrint:'دیکھیں / پرنٹ', newProductionEntry:'نئی پروڈکشن',
    producedProducts:'پیدا شدہ مصنوعات', producedKgOptional:'پیدا شدہ کلو', saveProduction:'پروڈکشن محفوظ کریں',
    recentProduction:'حالیہ پروڈکشن', productionRecord:'پروڈکشن ریکارڈ',
    newWheatPurchase:'نئی گندم خریداری', totalWheatKg:'کل گندم (کلو)', wheatRateKg:'گندم ریٹ فی کلو',
    bardanaRateBag:'باردانہ ریٹ فی بیگ', totalPurchaseCost:'کل خریداری لاگت',
    saveWheatPurchase:'گندم خریداری محفوظ کریں', newBardanaPurchase:'نئی باردانہ خریداری',
    ratePerBagLabel:'ریٹ فی بیگ', totalCost:'کل لاگت', saveBardanaPurchase:'باردانہ خریداری محفوظ کریں',
    addProduct:'مصنوعہ شامل کریں', active:'فعال', inactive:'غیر فعال', status:'حالت',
    openingProductStock:'ابتدائی مصنوعات اسٹاک', openingBardana:'ابتدائی باردانہ',
    openingCustomerBalance:'ابتدائی گاہک بقایا', openingSourceBalance:'ابتدائی ذریعہ بقایا',
    due:'واجب الادا', advance:'ایڈوانس', payable:'قابل ادائیگی', selectProduct:'مصنوعہ منتخب کریں',
    selectCustomer:'گاہک منتخب کریں', selectSource:'ذریعہ منتخب کریں', noRecords:'کوئی ریکارڈ نہیں', todayAtGlance:'آج کا خلاصہ',
    wheatStock:'گندم اسٹاک', todaysWheatIn:'آج کی گندم آمد', todaysSales:'آج کی فروخت',
    receivedToday:'آج موصول', currentFinishedStock:'موجودہ تیار مصنوعات اسٹاک', recentSales:'حالیہ فروخت',
    stockLabel:'اسٹاک', editCustomer:'گاہک میں ترمیم', printStatement:'اسٹیٹمنٹ / PDF پرنٹ',
    close:'بند کریں', editCustomerDetails:'گاہک تفصیل میں ترمیم', totalPurchased:'کل خریداری',
    totalPaid:'کل ادا', currentAdvance:'موجودہ ایڈوانس', currentPending:'موجودہ بقایا',
    receivePayment:'ادائیگی / ایڈوانس وصول', receive:'وصول کریں', ledger:'لیجر',
    reference:'حوالہ', purchase:'خریداری', payment:'ادائیگی', editSource:'ذریعہ میں ترمیم',
    editSourceDetails:'ذریعہ تفصیل میں ترمیم', currentBalance:'موجودہ بیلنس', paySource:'ذریعہ کو ادائیگی',
    pay:'ادا کریں', settled:'مکمل ادائیگی', searchCustomers:'نام، فون یا پتہ سے تلاش',
    searchSources:'نام، قسم، فون یا پتہ سے تلاش', about:'متعلق', software:'سافٹ ویئر', softwareVersion:'ورژن', developedBy:'تیار کردہ', developedMaintainedBy:'تیار کردہ اور دیکھ بھال', softwareGISEngineer:'سافٹ ویئر اور GIS انجینئر', portfolio:'پورٹ فولیو'
  }
};

const UiPreferencesContext=createContext(null);

export function UiPreferencesProvider({children}){
  const [theme,setTheme]=useState(()=>localStorage.getItem('mill-theme')||'light');
  const [language,setLanguage]=useState(()=>localStorage.getItem('mill-language')||'en');

  useEffect(()=>{
    localStorage.setItem('mill-theme',theme);
    document.documentElement.dataset.theme=theme;
  },[theme]);

  useEffect(()=>{
    localStorage.setItem('mill-language',language);
    document.documentElement.lang=language;
    document.documentElement.dir=language==='ur'?'rtl':'ltr';
  },[language]);

  const value=useMemo(()=>({
    theme,setTheme,language,setLanguage,
    t:(key,fallback)=>language==='ur'?(translations.ur[key]||fallback||key):(fallback||key)
  }),[theme,language]);

  return <UiPreferencesContext.Provider value={value}>{children}</UiPreferencesContext.Provider>;
}

export function useUiPreferences(){
  const value=useContext(UiPreferencesContext);
  if(!value) throw new Error('useUiPreferences must be used inside UiPreferencesProvider');
  return value;
}
