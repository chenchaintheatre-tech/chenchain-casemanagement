import React, { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "./supabaseClient";
import {
  Calendar, ChevronLeft, ChevronRight, Plus, X, Trash2, Users, DollarSign,
  Clock, AlertCircle, RefreshCw, Edit3, Save, UserPlus, Repeat, AlertTriangle, Wallet, Undo2, LogOut, Printer
} from "lucide-react";

/* =========================================================
   常數設定
========================================================= */
const COURSE_TYPES = [
  { key: "評估課", color: "#B45309", bg: "#FEF3C7", border: "#F59E0B" },
  { key: "個別課", color: "#1D4ED8", bg: "#DBEAFE", border: "#3B82F6" },
  { key: "家長課", color: "#6D28D9", bg: "#EDE9FE", border: "#8B5CF6" },
  { key: "團體課", color: "#047857", bg: "#D1FAE5", border: "#10B981" },
  { key: "雙人團體/手足課", color: "#0F766E", bg: "#CCFBF1", border: "#14B8A6" },
];
const courseInfo = (key) => COURSE_TYPES.find((c) => c.key === key) || COURSE_TYPES[0];

const DURATIONS = [
  { key: "u05m25", unit: 0.5, minutes: 25, label: "0.5堂（25分鐘）" },
  { key: "u05m30", unit: 0.5, minutes: 30, label: "0.5堂（30分鐘）" },
  { key: "u1m50", unit: 1, minutes: 50, label: "1堂（50分鐘）" },
  { key: "u1m60", unit: 1, minutes: 60, label: "1堂（60分鐘）" },
  { key: "u15m80", unit: 1.5, minutes: 80, label: "1.5堂（80分鐘）" },
];
const durationByKey = (key) => DURATIONS.find((d) => d.key === key) || DURATIONS[1];
const emptyPrices = () => ({ u05m25: "", u05m30: "", u1m50: "", u1m60: "", u15m80: "" });

const MODES = ["實體", "線上"];
const ATTENDANCE_OPTIONS = ["出席", "請假", "缺席"];
const attendanceColor = (status) => (status === "出席" ? "#2F7A3B" : status === "缺席" ? "#B4302A" : status === "請假" ? "#B45309" : "#9A9284");
const SEED_TEMPLATES = [{"id": "tpl1", "name": "週二 17:30 劉念恩、莊瑞奇、黃暄懷", "courseType": "團體課", "mode": "實體", "dayOfWeek": 2, "weekPattern": "even", "startTime": "17:30", "durationKey": "u1m50", "startDate": "2026-05-12", "endDate": null, "attendees": [{"id": "ratt1_劉念恩", "familyId": "fam_劉念恩", "memberId": "m_劉念恩", "planId": "plan32"}, {"id": "ratt1_莊瑞奇", "familyId": "fam_莊瑞奇", "memberId": "m_莊瑞奇", "planId": "plan90"}, {"id": "ratt1_黃暄懷", "familyId": "fam_黃暄懷", "memberId": "m_黃暄懷", "planId": "plan30"}], "cancelledDates": [], "active": true}, {"id": "tpl2", "name": "週二 18:00 蔡祈恩", "courseType": "個別課", "mode": "實體", "dayOfWeek": 2, "weekPattern": "odd", "startTime": "18:00", "durationKey": "u1m50", "startDate": "2026-05-05", "endDate": null, "attendees": [{"id": "ratt2_蔡祈恩", "familyId": "fam_蔡祈恩", "memberId": "m_蔡祈恩", "planId": "plan97"}], "cancelledDates": [], "active": true}, {"id": "tpl3", "name": "週二 19:00 林芊序", "courseType": "個別課", "mode": "實體", "dayOfWeek": 2, "weekPattern": "even", "startTime": "19:00", "durationKey": "u1m50", "startDate": "2026-05-26", "endDate": null, "attendees": [{"id": "ratt3_林芊序", "familyId": "fam_林芊序_林睿思", "memberId": "m_林芊序", "planId": "plan25"}], "cancelledDates": [], "active": true}, {"id": "tpl4", "name": "週三 14:00 張珈嘉", "courseType": "個別課", "mode": "實體", "dayOfWeek": 3, "weekPattern": "odd", "startTime": "14:00", "durationKey": "u1m50", "startDate": "2026-05-20", "endDate": null, "attendees": [{"id": "ratt4_張珈嘉", "familyId": "fam_張喆凱_張珈嘉", "memberId": "m_張珈嘉", "planId": "plan22"}], "cancelledDates": [], "active": true}, {"id": "tpl5", "name": "週三 14:30 宋之穎、李奕祈、林立磐、楊元震、王海安", "courseType": "團體課", "mode": "實體", "dayOfWeek": 3, "weekPattern": "even", "startTime": "14:30", "durationKey": "u15m80", "startDate": "2026-05-27", "endDate": null, "attendees": [{"id": "ratt5_宋之穎", "familyId": "fam_宋之穎", "memberId": "m_宋之穎", "planId": "plan100"}, {"id": "ratt5_李奕祈", "familyId": "fam_李奕祈_李欣芯", "memberId": "m_李奕祈", "planId": "plan2"}, {"id": "ratt5_林立磐", "familyId": "fam_林立磐", "memberId": "m_林立磐", "planId": "plan39"}, {"id": "ratt5_楊元震", "familyId": "fam_楊元震", "memberId": "m_楊元震", "planId": "plan37"}, {"id": "ratt5_王海安", "familyId": "fam_王海安", "memberId": "m_王海安", "planId": "plan36"}], "cancelledDates": [], "active": true}, {"id": "tpl6", "name": "週三 16:00 Sherrie", "courseType": "個別課", "mode": "實體", "dayOfWeek": 3, "weekPattern": "even", "startTime": "16:00", "durationKey": "u1m50", "startDate": "2026-05-13", "endDate": null, "attendees": [{"id": "ratt6_Sherrie", "familyId": "fam_Sherrie", "memberId": "m_Sherrie", "planId": "plan102"}], "cancelledDates": [], "active": true}, {"id": "tpl7", "name": "週三 17:00 張喆凱", "courseType": "個別課", "mode": "實體", "dayOfWeek": 3, "weekPattern": "every", "startTime": "17:00", "durationKey": "u1m50", "startDate": "2026-05-06", "endDate": null, "attendees": [{"id": "ratt7_張喆凱", "familyId": "fam_張喆凱_張珈嘉", "memberId": "m_張喆凱", "planId": "plan21"}], "cancelledDates": [], "active": true}, {"id": "tpl8", "name": "週四 15:00 王信壹", "courseType": "個別課", "mode": "實體", "dayOfWeek": 4, "weekPattern": "odd", "startTime": "15:00", "durationKey": "u1m50", "startDate": "2026-05-07", "endDate": null, "attendees": [{"id": "ratt8_王信壹", "familyId": "fam_王信壹", "memberId": "m_王信壹", "planId": "plan106"}], "cancelledDates": [], "active": true}, {"id": "tpl9", "name": "週四 16:00 李欣芯", "courseType": "個別課", "mode": "實體", "dayOfWeek": 4, "weekPattern": "odd", "startTime": "16:00", "durationKey": "u1m50", "startDate": "2026-05-07", "endDate": null, "attendees": [{"id": "ratt9_李欣芯", "familyId": "fam_李奕祈_李欣芯", "memberId": "m_李欣芯", "planId": "plan3"}], "cancelledDates": [], "active": true}, {"id": "tpl10", "name": "週四 17:00 邱泓熙", "courseType": "個別課", "mode": "實體", "dayOfWeek": 4, "weekPattern": "odd", "startTime": "17:00", "durationKey": "u1m50", "startDate": "2026-05-07", "endDate": null, "attendees": [{"id": "ratt10_邱泓熙", "familyId": "fam_邱泓熙_邱泓尹", "memberId": "m_邱泓熙", "planId": "plan6"}], "cancelledDates": [], "active": true}, {"id": "tpl11", "name": "週五 14:00 黃鼎翔", "courseType": "個別課", "mode": "實體", "dayOfWeek": 5, "weekPattern": "even", "startTime": "14:00", "durationKey": "u1m50", "startDate": "2026-05-08", "endDate": null, "attendees": [{"id": "ratt11_黃鼎翔", "familyId": "fam_黃鼎翔", "memberId": "m_黃鼎翔", "planId": "plan135"}], "cancelledDates": [], "active": true}, {"id": "tpl12", "name": "週五 17:30 王理、葉禮物、邱泓尹、金旻浩", "courseType": "團體課", "mode": "實體", "dayOfWeek": 5, "weekPattern": "even", "startTime": "17:30", "durationKey": "u1m60", "startDate": "2026-05-08", "endDate": null, "attendees": [{"id": "ratt12_王理", "familyId": "fam_王珩_王理", "memberId": "m_王理", "planId": "plan11"}, {"id": "ratt12_葉禮物", "familyId": "fam_葉禮物", "memberId": "m_葉禮物", "planId": "plan58"}, {"id": "ratt12_邱泓尹", "familyId": "fam_邱泓熙_邱泓尹", "memberId": "m_邱泓尹", "planId": "plan8"}, {"id": "ratt12_金旻浩", "familyId": "fam_金旻浩", "memberId": "m_金旻浩", "planId": "plan57"}], "cancelledDates": [], "active": true}, {"id": "tpl13", "name": "週五 18:00 劉元浩、杜政倫、盧士謙、謝品寬", "courseType": "團體課", "mode": "實體", "dayOfWeek": 5, "weekPattern": "odd", "startTime": "18:00", "durationKey": "u1m60", "startDate": "2026-05-15", "endDate": null, "attendees": [{"id": "ratt13_劉元浩", "familyId": "fam_劉元浩", "memberId": "m_劉元浩", "planId": "plan56"}, {"id": "ratt13_杜政倫", "familyId": "fam_杜政倫", "memberId": "m_杜政倫", "planId": "plan51"}, {"id": "ratt13_盧士謙", "familyId": "fam_盧士謙", "memberId": "m_盧士謙", "planId": "plan53"}, {"id": "ratt13_謝品寬", "familyId": "fam_謝品寬", "memberId": "m_謝品寬", "planId": "plan49"}], "cancelledDates": [], "active": true}, {"id": "tpl14", "name": "週六 12:30 吳富詮、王科元、蔣宜峻", "courseType": "團體課", "mode": "實體", "dayOfWeek": 6, "weekPattern": "even", "startTime": "12:30", "durationKey": "u15m80", "startDate": "2026-05-09", "endDate": null, "attendees": [{"id": "ratt14_吳富詮", "familyId": "fam_吳富詮", "memberId": "m_吳富詮", "planId": "plan66"}, {"id": "ratt14_王科元", "familyId": "fam_王科元", "memberId": "m_王科元", "planId": "plan64"}, {"id": "ratt14_蔣宜峻", "familyId": "fam_蔣宜峻", "memberId": "m_蔣宜峻", "planId": "plan68"}], "cancelledDates": [], "active": true}, {"id": "tpl15", "name": "週六 13:00 林子傑", "courseType": "個別課", "mode": "實體", "dayOfWeek": 6, "weekPattern": "odd", "startTime": "13:00", "durationKey": "u1m50", "startDate": "2026-05-16", "endDate": null, "attendees": [{"id": "ratt15_林子傑", "familyId": "fam_林子傑", "memberId": "m_林子傑", "planId": "plan110"}], "cancelledDates": [], "active": true}, {"id": "tpl16", "name": "週六 14:00 吳加恩、王學莆、王靖捷、蕭睿晴、陳奕銘", "courseType": "團體課", "mode": "實體", "dayOfWeek": 6, "weekPattern": "even", "startTime": "14:00", "durationKey": "u15m80", "startDate": "2026-05-23", "endDate": null, "attendees": [{"id": "ratt16_吳加恩", "familyId": "fam_吳加恩", "memberId": "m_吳加恩", "planId": "plan71"}, {"id": "ratt16_王學莆", "familyId": "fam_王學莆", "memberId": "m_王學莆", "planId": "plan72"}, {"id": "ratt16_王靖捷", "familyId": "fam_王靖捷", "memberId": "m_王靖捷", "planId": "plan74"}, {"id": "ratt16_蕭睿晴", "familyId": "fam_蕭睿晴", "memberId": "m_蕭睿晴", "planId": "plan69"}, {"id": "ratt16_陳奕銘", "familyId": "fam_陳霆宇_陳奕銘", "memberId": "m_陳奕銘", "planId": "plan19"}], "cancelledDates": [], "active": true}, {"id": "tpl17", "name": "週六 16:00 林秉諺、游侑恩、鐘育佳、陳允甯", "courseType": "團體課", "mode": "實體", "dayOfWeek": 6, "weekPattern": "odd", "startTime": "16:00", "durationKey": "u15m80", "startDate": "2026-05-02", "endDate": null, "attendees": [{"id": "ratt17_林秉諺", "familyId": "fam_林秉諺", "memberId": "m_林秉諺", "planId": "plan59"}, {"id": "ratt17_游侑恩", "familyId": "fam_游侑恩", "memberId": "m_游侑恩", "planId": "plan63"}, {"id": "ratt17_鐘育佳", "familyId": "fam_鐘育佳_鐘奕凡", "memberId": "m_鐘育佳", "planId": "plan13"}, {"id": "ratt17_陳允甯", "familyId": "fam_陳允甯", "memberId": "m_陳允甯", "planId": "plan61"}], "cancelledDates": [], "active": true}, {"id": "tpl18", "name": "週六 16:00 石宸皓、鐘奕凡、陳祺翰", "courseType": "團體課", "mode": "實體", "dayOfWeek": 6, "weekPattern": "even", "startTime": "16:00", "durationKey": "u15m80", "startDate": "2026-05-23", "endDate": null, "attendees": [{"id": "ratt18_石宸皓", "familyId": "fam_石宸皓", "memberId": "m_石宸皓", "planId": "plan79"}, {"id": "ratt18_鐘奕凡", "familyId": "fam_鐘育佳_鐘奕凡", "memberId": "m_鐘奕凡", "planId": "plan14"}, {"id": "ratt18_陳祺翰", "familyId": "fam_陳祺翰", "memberId": "m_陳祺翰", "planId": "plan76"}], "cancelledDates": [], "active": true}, {"id": "tpl19", "name": "每月第三個週日 14:00 團體課（博恩.家韻.悉睿.瑞奇.瀚宇）", "courseType": "團體課", "mode": "實體", "dayOfWeek": 0, "weekPattern": "third", "startTime": "14:00", "durationKey": "u15m80", "startDate": "2026-01-01", "endDate": null, "attendees": [{"id": "ratt19_許博恩", "familyId": "fam_許博恩", "memberId": "m_許博恩", "planId": "plan82"}, {"id": "ratt19_林家韻", "familyId": "fam_林家韻", "memberId": "m_林家韻", "planId": "plan84"}, {"id": "ratt19_藍悉睿", "familyId": "fam_藍悉睿", "memberId": "m_藍悉睿", "planId": "plan87"}, {"id": "ratt19_莊瑞奇", "familyId": "fam_莊瑞奇", "memberId": "m_莊瑞奇", "planId": "plan90"}, {"id": "ratt19_陳瀚宇", "familyId": "fam_陳瀚宇", "memberId": "m_陳瀚宇", "planId": "plan92"}], "cancelledDates": [], "active": true}, {"id": "tpl20", "name": "每月第三個週日 15:20 團體課後家長課", "courseType": "家長課", "mode": "實體", "dayOfWeek": 0, "weekPattern": "third", "startTime": "15:20", "durationKey": "u05m30", "startDate": "2026-01-01", "endDate": null, "attendees": [{"id": "ratt20_許博恩", "familyId": "fam_許博恩", "memberId": "m_許博恩", "planId": "plan201"}, {"id": "ratt20_林家韻", "familyId": "fam_林家韻", "memberId": "m_林家韻", "planId": "plan202"}, {"id": "ratt20_藍悉睿", "familyId": "fam_藍悉睿", "memberId": "m_藍悉睿", "planId": "plan203"}, {"id": "ratt20_莊瑞奇", "familyId": "fam_莊瑞奇", "memberId": "m_莊瑞奇", "planId": null}, {"id": "ratt20_陳瀚宇", "familyId": "fam_陳瀚宇", "memberId": "m_陳瀚宇", "planId": "plan204"}], "cancelledDates": [], "active": true}, {"id": "tpl21", "name": "每月第三個週日 16:00 團體課（與之.瀅軒.芷芸）", "courseType": "團體課", "mode": "實體", "dayOfWeek": 0, "weekPattern": "third", "startTime": "16:00", "durationKey": "u15m80", "startDate": "2026-01-01", "endDate": null, "attendees": [{"id": "ratt21_施與之", "familyId": "fam_施與之", "memberId": "m_施與之", "planId": "plan95"}, {"id": "ratt21_黃瀅軒", "familyId": "fam_黃瀅軒", "memberId": "m_黃瀅軒", "planId": "plan94"}, {"id": "ratt21_張芷芸", "familyId": "fam_張芷芸", "memberId": "m_張芷芸", "planId": "plan140"}], "cancelledDates": [], "active": true}];

const WEEK_PATTERNS = [
  { key: "every", label: "每週" },
  { key: "odd", label: "單週（第1、3週）" },
  { key: "even", label: "雙週（第2、4週）" },
  { key: "first", label: "僅第一週" },
  { key: "second", label: "僅第二週" },
  { key: "third", label: "僅第三週" },
  { key: "fourth", label: "僅第四週" },
];
const WEEKDAY_FULL = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
const WEEKDAYS = ["一", "二", "三", "四", "五", "六", "日"];
const RELATIONS = ["學生", "家長", "手足", "其他"];
const PAYMENT_METHOD_TYPES = ["現金", "匯款"];
const STORAGE_KEY = "studio-crm-data-v3";

const SEED_FAMILIES = [{"id": "fam_李奕祈_李欣芯", "familyName": "李奕祈／李欣芯家", "note": "", "members": [{"id": "m_李奕祈", "name": "李奕祈", "relation": "學生", "plans": [{"courseType": "個別課", "prices": {"u05m25": "", "u1m50": "2400", "u1m60": "", "u15m80": ""}, "id": "plan1"}, {"courseType": "團體課", "prices": {"u05m25": "", "u1m50": "", "u1m60": "", "u15m80": "1500"}, "id": "plan2"}]}, {"id": "m_李欣芯", "name": "李欣芯", "relation": "學生", "plans": [{"courseType": "個別課", "prices": {"u05m25": "", "u1m50": "2400", "u1m60": "", "u15m80": ""}, "id": "plan3"}]}, {"id": "parent_fam_李奕祈_李欣芯", "name": "家長", "relation": "家長", "plans": []}], "storedAccounts": [{"id": "acc4", "pricePerUnit": 1000.0, "remainingUnits": 0, "topUps": []}, {"id": "acc5", "pricePerUnit": 2200.0, "remainingUnits": 0, "topUps": []}]}, {"id": "fam_邱泓熙_邱泓尹", "familyName": "邱泓熙／邱泓尹家", "note": "", "members": [{"id": "m_邱泓熙", "name": "邱泓熙", "relation": "學生", "plans": [{"courseType": "個別課", "prices": {"u05m25": "", "u1m50": "2400", "u1m60": "", "u15m80": ""}, "id": "plan6"}, {"courseType": "團體課", "prices": {"u05m25": "", "u1m50": "", "u1m60": "", "u15m80": "1500"}, "id": "plan7"}]}, {"id": "m_邱泓尹", "name": "邱泓尹", "relation": "學生", "plans": [{"courseType": "團體課", "prices": {"u05m25": "", "u1m50": "", "u1m60": "1000", "u15m80": ""}, "id": "plan8"}]}, {"id": "parent_fam_邱泓熙_邱泓尹", "name": "家長", "relation": "家長", "plans": []}], "storedAccounts": [{"id": "acc9", "pricePerUnit": 1000.0, "remainingUnits": 0, "topUps": []}]}, {"id": "fam_王珩_王理", "familyName": "王珩／王理家", "note": "", "members": [{"id": "m_王珩", "name": "王珩", "relation": "學生", "plans": [{"courseType": "個別課", "prices": {"u05m25": "", "u1m50": "1500", "u1m60": "", "u15m80": ""}, "id": "plan10"}]}, {"id": "m_王理", "name": "王理", "relation": "學生", "plans": [{"courseType": "團體課", "prices": {"u05m25": "", "u1m50": "", "u1m60": "1000", "u15m80": ""}, "id": "plan11"}]}, {"id": "parent_fam_王珩_王理", "name": "家長", "relation": "家長", "plans": []}], "storedAccounts": []}, {"id": "fam_鐘育佳_鐘奕凡", "familyName": "鐘育佳／鐘奕凡家", "note": "", "members": [{"id": "m_鐘育佳", "name": "鐘育佳", "relation": "學生", "plans": [{"courseType": "個別課", "prices": {"u05m25": "", "u1m50": "2600", "u1m60": "", "u15m80": ""}, "id": "plan12"}, {"courseType": "團體課", "prices": {"u05m25": "", "u1m50": "", "u1m60": "", "u15m80": "1500"}, "id": "plan13"}]}, {"id": "m_鐘奕凡", "name": "鐘奕凡", "relation": "學生", "plans": [{"courseType": "團體課", "prices": {"u05m25": "", "u1m50": "", "u1m60": "", "u15m80": "1500"}, "id": "plan14"}]}, {"id": "parent_fam_鐘育佳_鐘奕凡", "name": "家長", "relation": "家長", "plans": []}], "storedAccounts": [{"id": "acc15", "pricePerUnit": 2600.0, "remainingUnits": 0, "topUps": []}, {"id": "acc16", "pricePerUnit": 1000.0, "remainingUnits": 0, "topUps": []}]}, {"id": "fam_陳霆宇_陳奕銘", "familyName": "陳霆宇／陳奕銘家", "note": "", "members": [{"id": "m_陳霆宇", "name": "陳霆宇", "relation": "學生", "plans": [{"courseType": "個別課", "prices": {"u05m25": "", "u1m50": "1800", "u1m60": "", "u15m80": ""}, "id": "plan17"}]}, {"id": "m_陳奕銘", "name": "陳奕銘", "relation": "學生", "plans": [{"courseType": "個別課", "prices": {"u05m25": "", "u1m50": "1800", "u1m60": "", "u15m80": ""}, "id": "plan18"}, {"courseType": "團體課", "prices": {"u05m25": "", "u1m50": "", "u1m60": "", "u15m80": "1500"}, "id": "plan19"}]}, {"id": "parent_fam_陳霆宇_陳奕銘", "name": "家長", "relation": "家長", "plans": []}], "storedAccounts": [{"id": "acc20", "pricePerUnit": 1000.0, "remainingUnits": 0, "topUps": []}]}, {"id": "fam_張喆凱_張珈嘉", "familyName": "張喆凱／張珈嘉家", "note": "", "members": [{"id": "m_張喆凱", "name": "張喆凱", "relation": "學生", "plans": [{"courseType": "個別課", "prices": {"u05m25": "", "u1m50": "2600", "u1m60": "", "u15m80": ""}, "id": "plan21"}]}, {"id": "m_張珈嘉", "name": "張珈嘉", "relation": "學生", "plans": [{"courseType": "個別課", "prices": {"u05m25": "", "u1m50": "2600", "u1m60": "", "u15m80": ""}, "id": "plan22"}]}, {"id": "parent_fam_張喆凱_張珈嘉", "name": "家長", "relation": "家長", "plans": []}], "storedAccounts": [{"id": "acc23", "pricePerUnit": 2600.0, "remainingUnits": 0, "topUps": []}, {"id": "acc24", "pricePerUnit": 2600.0, "remainingUnits": 0, "topUps": []}]}, {"id": "fam_林芊序_林睿思", "familyName": "林芊序／林睿思家", "note": "", "members": [{"id": "m_林芊序", "name": "林芊序", "relation": "學生", "plans": [{"courseType": "個別課", "prices": {"u05m25": "", "u1m50": "2600", "u1m60": "", "u15m80": ""}, "id": "plan25"}]}, {"id": "m_林睿思", "name": "林睿思", "relation": "學生", "plans": [{"courseType": "個別課", "prices": {"u05m25": "", "u1m50": "2600", "u1m60": "", "u15m80": ""}, "id": "plan26"}]}, {"id": "parent_fam_林芊序_林睿思", "name": "家長", "relation": "家長", "plans": []}], "storedAccounts": [{"id": "acc27", "pricePerUnit": 2600.0, "remainingUnits": 0, "topUps": []}, {"id": "acc28", "pricePerUnit": 2600.0, "remainingUnits": 0, "topUps": []}]}, {"id": "fam_黃暄懷", "familyName": "黃暄懷", "note": "", "members": [{"id": "m_黃暄懷", "name": "黃暄懷", "relation": "學生", "plans": [{"courseType": "個別課", "prices": {"u05m25": "", "u1m50": "", "u1m60": "1800", "u15m80": ""}, "id": "plan29"}, {"courseType": "團體課", "prices": {"u05m25": "", "u1m50": "", "u1m60": "1000", "u15m80": ""}, "id": "plan30"}]}, {"id": "parent_fam_黃暄懷", "name": "家長", "relation": "家長", "plans": []}], "storedAccounts": []}, {"id": "fam_劉念恩", "familyName": "劉念恩", "note": "", "members": [{"id": "m_劉念恩", "name": "劉念恩", "relation": "學生", "plans": [{"courseType": "個別課", "prices": {"u05m25": "", "u1m50": "2600", "u1m60": "", "u15m80": ""}, "id": "plan31"}, {"courseType": "團體課", "prices": {"u05m25": "", "u1m50": "", "u1m60": "1000", "u15m80": ""}, "id": "plan32"}]}, {"id": "parent_fam_劉念恩", "name": "家長", "relation": "家長", "plans": []}], "storedAccounts": [{"id": "acc33", "pricePerUnit": 2600.0, "remainingUnits": 0, "topUps": []}, {"id": "acc34", "pricePerUnit": 1000.0, "remainingUnits": 0, "topUps": []}]}, {"id": "fam_王海安", "familyName": "王海安", "note": "", "members": [{"id": "m_王海安", "name": "王海安", "relation": "學生", "plans": [{"courseType": "個別課", "prices": {"u05m25": "", "u1m50": "2600", "u1m60": "", "u15m80": ""}, "id": "plan35"}, {"courseType": "團體課", "prices": {"u05m25": "", "u1m50": "", "u1m60": "", "u15m80": "1500"}, "id": "plan36"}]}, {"id": "parent_fam_王海安", "name": "家長", "relation": "家長", "plans": []}], "storedAccounts": []}, {"id": "fam_楊元震", "familyName": "楊元震", "note": "", "members": [{"id": "m_楊元震", "name": "楊元震", "relation": "學生", "plans": [{"courseType": "團體課", "prices": {"u05m25": "", "u1m50": "", "u1m60": "", "u15m80": "1300"}, "id": "plan37"}]}, {"id": "parent_fam_楊元震", "name": "家長", "relation": "家長", "plans": []}], "storedAccounts": []}, {"id": "fam_林立磐", "familyName": "林立磐", "note": "", "members": [{"id": "m_林立磐", "name": "林立磐", "relation": "學生", "plans": [{"courseType": "個別課", "prices": {"u05m25": "", "u1m50": "2600", "u1m60": "", "u15m80": ""}, "id": "plan38"}, {"courseType": "團體課", "prices": {"u05m25": "", "u1m50": "", "u1m60": "", "u15m80": "1500"}, "id": "plan39"}]}, {"id": "parent_fam_林立磐", "name": "家長", "relation": "家長", "plans": []}], "storedAccounts": [{"id": "acc40", "pricePerUnit": 2600.0, "remainingUnits": 0, "topUps": []}, {"id": "acc41", "pricePerUnit": 1000.0, "remainingUnits": 0, "topUps": []}]}, {"id": "fam_曾善淵", "familyName": "曾善淵", "note": "", "members": [{"id": "m_曾善淵", "name": "曾善淵", "relation": "學生", "plans": [{"courseType": "個別課", "prices": {"u05m25": "", "u1m50": "2600", "u1m60": "", "u15m80": ""}, "id": "plan42"}, {"courseType": "團體課", "prices": {"u05m25": "", "u1m50": "", "u1m60": "", "u15m80": "1500"}, "id": "plan43"}]}, {"id": "parent_fam_曾善淵", "name": "家長", "relation": "家長", "plans": []}], "storedAccounts": [{"id": "acc44", "pricePerUnit": 1000.0, "remainingUnits": 0, "topUps": []}]}, {"id": "fam_張楷旭", "familyName": "張楷旭", "note": "", "members": [{"id": "m_張楷旭", "name": "張楷旭", "relation": "學生", "plans": [{"courseType": "個別課", "prices": {"u05m25": "", "u1m50": "2600", "u1m60": "", "u15m80": ""}, "id": "plan45"}, {"courseType": "團體課", "prices": {"u05m25": "", "u1m50": "", "u1m60": "", "u15m80": "1500"}, "id": "plan46"}]}, {"id": "parent_fam_張楷旭", "name": "家長", "relation": "家長", "plans": []}], "storedAccounts": [{"id": "acc47", "pricePerUnit": 1000.0, "remainingUnits": 0, "topUps": []}]}, {"id": "fam_謝品寬", "familyName": "謝品寬", "note": "", "members": [{"id": "m_謝品寬", "name": "謝品寬", "relation": "學生", "plans": [{"courseType": "個別課", "prices": {"u05m25": "", "u1m50": "1000", "u1m60": "", "u15m80": ""}, "id": "plan48"}, {"courseType": "團體課", "prices": {"u05m25": "", "u1m50": "", "u1m60": "1000", "u15m80": ""}, "id": "plan49"}]}, {"id": "parent_fam_謝品寬", "name": "家長", "relation": "家長", "plans": []}], "storedAccounts": []}, {"id": "fam_杜政倫", "familyName": "杜政倫", "note": "", "members": [{"id": "m_杜政倫", "name": "杜政倫", "relation": "學生", "plans": [{"courseType": "個別課", "prices": {"u05m25": "", "u1m50": "1000", "u1m60": "", "u15m80": ""}, "id": "plan50"}, {"courseType": "團體課", "prices": {"u05m25": "", "u1m50": "", "u1m60": "1000", "u15m80": ""}, "id": "plan51"}]}, {"id": "parent_fam_杜政倫", "name": "家長", "relation": "家長", "plans": []}], "storedAccounts": []}, {"id": "fam_盧士謙", "familyName": "盧士謙", "note": "", "members": [{"id": "m_盧士謙", "name": "盧士謙", "relation": "學生", "plans": [{"courseType": "個別課", "prices": {"u05m25": "", "u1m50": "1000", "u1m60": "", "u15m80": ""}, "id": "plan52"}, {"courseType": "團體課", "prices": {"u05m25": "", "u1m50": "", "u1m60": "1000", "u15m80": ""}, "id": "plan53"}, {"courseType": "家長課", "prices": {"u05m25": "500", "u1m50": "", "u1m60": "", "u15m80": ""}, "id": "plan54"}]}, {"id": "parent_fam_盧士謙", "name": "家長", "relation": "家長", "plans": []}], "storedAccounts": []}, {"id": "fam_劉元浩", "familyName": "劉元浩", "note": "", "members": [{"id": "m_劉元浩", "name": "劉元浩", "relation": "學生", "plans": [{"courseType": "個別課", "prices": {"u05m25": "", "u1m50": "1800", "u1m60": "", "u15m80": ""}, "id": "plan55"}, {"courseType": "團體課", "prices": {"u05m25": "", "u1m50": "", "u1m60": "1000", "u15m80": ""}, "id": "plan56"}]}, {"id": "parent_fam_劉元浩", "name": "家長", "relation": "家長", "plans": []}], "storedAccounts": []}, {"id": "fam_金旻浩", "familyName": "金旻浩", "note": "", "members": [{"id": "m_金旻浩", "name": "金旻浩", "relation": "學生", "plans": [{"courseType": "團體課", "prices": {"u05m25": "", "u1m50": "", "u1m60": "1000", "u15m80": ""}, "id": "plan57"}]}, {"id": "parent_fam_金旻浩", "name": "家長", "relation": "家長", "plans": []}], "storedAccounts": []}, {"id": "fam_葉禮物", "familyName": "葉禮物", "note": "", "members": [{"id": "m_葉禮物", "name": "葉禮物", "relation": "學生", "plans": [{"courseType": "團體課", "prices": {"u05m25": "", "u1m50": "", "u1m60": "1000", "u15m80": ""}, "id": "plan58"}]}, {"id": "parent_fam_葉禮物", "name": "家長", "relation": "家長", "plans": []}], "storedAccounts": []}, {"id": "fam_林秉諺", "familyName": "林秉諺", "note": "", "members": [{"id": "m_林秉諺", "name": "林秉諺", "relation": "學生", "plans": [{"courseType": "團體課", "prices": {"u05m25": "", "u1m50": "", "u1m60": "", "u15m80": "1500"}, "id": "plan59"}]}, {"id": "parent_fam_林秉諺", "name": "家長", "relation": "家長", "plans": []}], "storedAccounts": [{"id": "acc60", "pricePerUnit": 1000.0, "remainingUnits": 0, "topUps": []}]}, {"id": "fam_陳允甯", "familyName": "陳允甯", "note": "", "members": [{"id": "m_陳允甯", "name": "陳允甯", "relation": "學生", "plans": [{"courseType": "團體課", "prices": {"u05m25": "", "u1m50": "", "u1m60": "", "u15m80": "1500"}, "id": "plan61"}]}, {"id": "parent_fam_陳允甯", "name": "家長", "relation": "家長", "plans": []}], "storedAccounts": [{"id": "acc62", "pricePerUnit": 1000.0, "remainingUnits": 0, "topUps": []}]}, {"id": "fam_游侑恩", "familyName": "游侑恩", "note": "", "members": [{"id": "m_游侑恩", "name": "游侑恩", "relation": "學生", "plans": [{"courseType": "團體課", "prices": {"u05m25": "", "u1m50": "", "u1m60": "", "u15m80": "1500"}, "id": "plan63"}]}, {"id": "parent_fam_游侑恩", "name": "家長", "relation": "家長", "plans": []}], "storedAccounts": []}, {"id": "fam_王科元", "familyName": "王科元", "note": "", "members": [{"id": "m_王科元", "name": "王科元", "relation": "學生", "plans": [{"courseType": "團體課", "prices": {"u05m25": "", "u1m50": "", "u1m60": "", "u15m80": "1500"}, "id": "plan64"}]}, {"id": "parent_fam_王科元", "name": "家長", "relation": "家長", "plans": []}], "storedAccounts": [{"id": "acc65", "pricePerUnit": 1000.0, "remainingUnits": 0, "topUps": []}]}, {"id": "fam_吳富詮", "familyName": "吳富詮", "note": "", "members": [{"id": "m_吳富詮", "name": "吳富詮", "relation": "學生", "plans": [{"courseType": "團體課", "prices": {"u05m25": "", "u1m50": "", "u1m60": "", "u15m80": "1500"}, "id": "plan66"}]}, {"id": "parent_fam_吳富詮", "name": "家長", "relation": "家長", "plans": []}], "storedAccounts": []}, {"id": "fam_吳宇澤", "familyName": "吳宇澤", "note": "", "members": [{"id": "m_吳宇澤", "name": "吳宇澤", "relation": "學生", "plans": [{"courseType": "團體課", "prices": {"u05m25": "", "u1m50": "", "u1m60": "", "u15m80": "1500"}, "id": "plan67"}]}, {"id": "parent_fam_吳宇澤", "name": "家長", "relation": "家長", "plans": []}], "storedAccounts": []}, {"id": "fam_蔣宜峻", "familyName": "蔣宜峻", "note": "", "members": [{"id": "m_蔣宜峻", "name": "蔣宜峻", "relation": "學生", "plans": [{"courseType": "團體課", "prices": {"u05m25": "", "u1m50": "", "u1m60": "", "u15m80": "1500"}, "id": "plan68"}]}, {"id": "parent_fam_蔣宜峻", "name": "家長", "relation": "家長", "plans": []}], "storedAccounts": []}, {"id": "fam_蕭睿晴", "familyName": "蕭睿晴", "note": "", "members": [{"id": "m_蕭睿晴", "name": "蕭睿晴", "relation": "學生", "plans": [{"courseType": "團體課", "prices": {"u05m25": "", "u1m50": "", "u1m60": "", "u15m80": "1500"}, "id": "plan69"}]}, {"id": "parent_fam_蕭睿晴", "name": "家長", "relation": "家長", "plans": []}], "storedAccounts": [{"id": "acc70", "pricePerUnit": 1000.0, "remainingUnits": 0, "topUps": []}]}, {"id": "fam_吳加恩", "familyName": "吳加恩", "note": "", "members": [{"id": "m_吳加恩", "name": "吳加恩", "relation": "學生", "plans": [{"courseType": "團體課", "prices": {"u05m25": "", "u1m50": "", "u1m60": "", "u15m80": "1500"}, "id": "plan71"}]}, {"id": "parent_fam_吳加恩", "name": "家長", "relation": "家長", "plans": []}], "storedAccounts": []}, {"id": "fam_王學莆", "familyName": "王學莆", "note": "", "members": [{"id": "m_王學莆", "name": "王學莆", "relation": "學生", "plans": [{"courseType": "團體課", "prices": {"u05m25": "", "u1m50": "", "u1m60": "", "u15m80": "1500"}, "id": "plan72"}]}, {"id": "parent_fam_王學莆", "name": "家長", "relation": "家長", "plans": []}], "storedAccounts": [{"id": "acc73", "pricePerUnit": 1000.0, "remainingUnits": 0, "topUps": []}]}, {"id": "fam_王靖捷", "familyName": "王靖捷", "note": "", "members": [{"id": "m_王靖捷", "name": "王靖捷", "relation": "學生", "plans": [{"courseType": "團體課", "prices": {"u05m25": "", "u1m50": "", "u1m60": "", "u15m80": "1500"}, "id": "plan74"}]}, {"id": "parent_fam_王靖捷", "name": "家長", "relation": "家長", "plans": []}], "storedAccounts": [{"id": "acc75", "pricePerUnit": 1000.0, "remainingUnits": 0, "topUps": []}]}, {"id": "fam_陳祺翰", "familyName": "陳祺翰", "note": "", "members": [{"id": "m_陳祺翰", "name": "陳祺翰", "relation": "學生", "plans": [{"courseType": "團體課", "prices": {"u05m25": "", "u1m50": "", "u1m60": "", "u15m80": "1500"}, "id": "plan76"}]}, {"id": "parent_fam_陳祺翰", "name": "家長", "relation": "家長", "plans": []}], "storedAccounts": [{"id": "acc77", "pricePerUnit": 1000.0, "remainingUnits": 0, "topUps": []}]}, {"id": "fam_石宸皓", "familyName": "石宸皓", "note": "", "members": [{"id": "m_石宸皓", "name": "石宸皓", "relation": "學生", "plans": [{"courseType": "個別課", "prices": {"u05m25": "", "u1m50": "2600", "u1m60": "", "u15m80": ""}, "id": "plan78"}, {"courseType": "團體課", "prices": {"u05m25": "", "u1m50": "", "u1m60": "", "u15m80": "1500"}, "id": "plan79"}]}, {"id": "parent_fam_石宸皓", "name": "家長", "relation": "家長", "plans": []}], "storedAccounts": [{"id": "acc80", "pricePerUnit": 2600.0, "remainingUnits": 0, "topUps": []}, {"id": "acc81", "pricePerUnit": 1000.0, "remainingUnits": 0, "topUps": []}]}, {"id": "fam_許博恩", "familyName": "許博恩", "note": "", "members": [{"id": "m_許博恩", "name": "許博恩", "relation": "學生", "plans": [{"courseType": "團體課", "prices": {"u05m25": "", "u1m50": "", "u1m60": "", "u15m80": "1500"}, "id": "plan82"}, {"courseType": "家長課", "prices": {"u05m25": "", "u1m50": "", "u1m60": "", "u15m80": "", "u05m30": "500"}, "id": "plan201"}]}, {"id": "parent_fam_許博恩", "name": "家長", "relation": "家長", "plans": []}], "storedAccounts": [{"id": "acc83", "pricePerUnit": 1000.0, "remainingUnits": 0, "topUps": []}]}, {"id": "fam_林家韻", "familyName": "林家韻", "note": "", "members": [{"id": "m_林家韻", "name": "林家韻", "relation": "學生", "plans": [{"courseType": "團體課", "prices": {"u05m25": "", "u1m50": "", "u1m60": "", "u15m80": "1500"}, "id": "plan84"}, {"courseType": "家長課", "prices": {"u05m25": "", "u1m50": "", "u1m60": "", "u15m80": "", "u05m30": "500"}, "id": "plan202"}]}, {"id": "parent_fam_林家韻", "name": "家長", "relation": "家長", "plans": []}], "storedAccounts": [{"id": "acc85", "pricePerUnit": 1000.0, "remainingUnits": 0, "topUps": []}]}, {"id": "fam_藍悉睿", "familyName": "藍悉睿", "note": "", "members": [{"id": "m_藍悉睿", "name": "藍悉睿", "relation": "學生", "plans": [{"courseType": "個別課", "prices": {"u05m25": "", "u1m50": "1800", "u1m60": "", "u15m80": ""}, "id": "plan86"}, {"courseType": "團體課", "prices": {"u05m25": "", "u1m50": "", "u1m60": "", "u15m80": "1500"}, "id": "plan87"}, {"courseType": "家長課", "prices": {"u05m25": "", "u1m50": "", "u1m60": "", "u15m80": "", "u05m30": "500"}, "id": "plan203"}]}, {"id": "parent_fam_藍悉睿", "name": "家長", "relation": "家長", "plans": []}], "storedAccounts": [{"id": "acc88", "pricePerUnit": 1000.0, "remainingUnits": 0, "topUps": []}]}, {"id": "fam_莊瑞奇", "familyName": "莊瑞奇", "note": "", "members": [{"id": "m_莊瑞奇", "name": "莊瑞奇", "relation": "學生", "plans": [{"courseType": "個別課", "prices": {"u05m25": "", "u1m50": "1000", "u1m60": "", "u15m80": ""}, "id": "plan89"}, {"courseType": "團體課", "prices": {"u05m25": "", "u1m50": "1000", "u1m60": "", "u15m80": ""}, "id": "plan90"}]}, {"id": "parent_fam_莊瑞奇", "name": "家長", "relation": "家長", "plans": []}], "storedAccounts": [{"id": "acc91", "pricePerUnit": 1000.0, "remainingUnits": 0, "topUps": []}]}, {"id": "fam_陳瀚宇", "familyName": "陳瀚宇", "note": "", "members": [{"id": "m_陳瀚宇", "name": "陳瀚宇", "relation": "學生", "plans": [{"courseType": "團體課", "prices": {"u05m25": "", "u1m50": "", "u1m60": "", "u15m80": "1500"}, "id": "plan92"}, {"courseType": "家長課", "prices": {"u05m25": "", "u1m50": "", "u1m60": "", "u15m80": "", "u05m30": "500"}, "id": "plan204"}]}, {"id": "parent_fam_陳瀚宇", "name": "家長", "relation": "家長", "plans": []}], "storedAccounts": [{"id": "acc93", "pricePerUnit": 1000.0, "remainingUnits": 0, "topUps": []}]}, {"id": "fam_黃瀅軒", "familyName": "黃瀅軒", "note": "", "members": [{"id": "m_黃瀅軒", "name": "黃瀅軒", "relation": "學生", "plans": [{"courseType": "團體課", "prices": {"u05m25": "", "u1m50": "", "u1m60": "", "u15m80": "1500"}, "id": "plan94"}]}, {"id": "parent_fam_黃瀅軒", "name": "家長", "relation": "家長", "plans": []}], "storedAccounts": []}, {"id": "fam_施與之", "familyName": "施與之", "note": "", "members": [{"id": "m_施與之", "name": "施與之", "relation": "學生", "plans": [{"courseType": "團體課", "prices": {"u05m25": "", "u1m50": "", "u1m60": "", "u15m80": "1500"}, "id": "plan95"}]}, {"id": "parent_fam_施與之", "name": "家長", "relation": "家長", "plans": []}], "storedAccounts": [{"id": "acc96", "pricePerUnit": 1000.0, "remainingUnits": 0, "topUps": []}]}, {"id": "fam_蔡祈恩", "familyName": "蔡祈恩", "note": "", "members": [{"id": "m_蔡祈恩", "name": "蔡祈恩", "relation": "學生", "plans": [{"courseType": "個別課", "prices": {"u05m25": "", "u1m50": "2600", "u1m60": "", "u15m80": ""}, "id": "plan97"}]}, {"id": "parent_fam_蔡祈恩", "name": "家長", "relation": "家長", "plans": []}], "storedAccounts": [{"id": "acc98", "pricePerUnit": 2600.0, "remainingUnits": 0, "topUps": []}]}, {"id": "fam_宋之穎", "familyName": "宋之穎", "note": "", "members": [{"id": "m_宋之穎", "name": "宋之穎", "relation": "學生", "plans": [{"courseType": "個別課", "prices": {"u05m25": "", "u1m50": "2600", "u1m60": "", "u15m80": ""}, "id": "plan99"}, {"courseType": "團體課", "prices": {"u05m25": "", "u1m50": "", "u1m60": "", "u15m80": "1500"}, "id": "plan100"}]}, {"id": "parent_fam_宋之穎", "name": "家長", "relation": "家長", "plans": []}], "storedAccounts": [{"id": "acc101", "pricePerUnit": 2600.0, "remainingUnits": 0, "topUps": []}]}, {"id": "fam_Sherrie", "familyName": "Sherrie", "note": "", "members": [{"id": "m_Sherrie", "name": "Sherrie", "relation": "學生", "plans": [{"courseType": "個別課", "prices": {"u05m25": "", "u1m50": "2600", "u1m60": "", "u15m80": ""}, "id": "plan102"}]}, {"id": "parent_fam_Sherrie", "name": "家長", "relation": "家長", "plans": []}], "storedAccounts": [{"id": "acc103", "pricePerUnit": 2600.0, "remainingUnits": 0, "topUps": []}]}, {"id": "fam_黃柏允", "familyName": "黃柏允", "note": "", "members": [{"id": "m_黃柏允", "name": "黃柏允", "relation": "學生", "plans": [{"courseType": "個別課", "prices": {"u05m25": "", "u1m50": "2600", "u1m60": "", "u15m80": ""}, "id": "plan104"}]}, {"id": "parent_fam_黃柏允", "name": "家長", "relation": "家長", "plans": []}], "storedAccounts": [{"id": "acc105", "pricePerUnit": 2600.0, "remainingUnits": 0, "topUps": []}]}, {"id": "fam_王信壹", "familyName": "王信壹", "note": "", "members": [{"id": "m_王信壹", "name": "王信壹", "relation": "學生", "plans": [{"courseType": "個別課", "prices": {"u05m25": "", "u1m50": "2600", "u1m60": "", "u15m80": ""}, "id": "plan106"}]}, {"id": "parent_fam_王信壹", "name": "家長", "relation": "家長", "plans": []}], "storedAccounts": [{"id": "acc107", "pricePerUnit": 2600.0, "remainingUnits": 0, "topUps": []}]}, {"id": "fam_何誠育", "familyName": "何誠育", "note": "", "members": [{"id": "m_何誠育", "name": "何誠育", "relation": "學生", "plans": [{"courseType": "個別課", "prices": {"u05m25": "", "u1m50": "2600", "u1m60": "", "u15m80": ""}, "id": "plan108"}]}, {"id": "parent_fam_何誠育", "name": "家長", "relation": "家長", "plans": []}], "storedAccounts": [{"id": "acc109", "pricePerUnit": 2600.0, "remainingUnits": 0, "topUps": []}]}, {"id": "fam_林子傑", "familyName": "林子傑", "note": "", "members": [{"id": "m_林子傑", "name": "林子傑", "relation": "學生", "plans": [{"courseType": "個別課", "prices": {"u05m25": "", "u1m50": "1000", "u1m60": "", "u15m80": ""}, "id": "plan110"}]}, {"id": "parent_fam_林子傑", "name": "家長", "relation": "家長", "plans": []}], "storedAccounts": []}, {"id": "fam_李宛玲", "familyName": "李宛玲", "note": "", "members": [{"id": "m_李宛玲", "name": "李宛玲", "relation": "學生", "plans": [{"courseType": "個別課", "prices": {"u05m25": "", "u1m50": "800", "u1m60": "", "u15m80": ""}, "id": "plan111"}]}, {"id": "parent_fam_李宛玲", "name": "家長", "relation": "家長", "plans": []}], "storedAccounts": []}, {"id": "fam_朱舒可", "familyName": "朱舒可", "note": "", "members": [{"id": "m_朱舒可", "name": "朱舒可", "relation": "學生", "plans": [{"courseType": "個別課", "prices": {"u05m25": "", "u1m50": "1400", "u1m60": "", "u15m80": "1500"}, "id": "plan112"}]}, {"id": "parent_fam_朱舒可", "name": "家長", "relation": "家長", "plans": []}], "storedAccounts": []}, {"id": "fam_陳祺淵", "familyName": "陳祺淵", "note": "", "members": [{"id": "m_陳祺淵", "name": "陳祺淵", "relation": "學生", "plans": [{"courseType": "個別課", "prices": {"u05m25": "", "u1m50": "2600", "u1m60": "", "u15m80": ""}, "id": "plan113"}]}, {"id": "parent_fam_陳祺淵", "name": "家長", "relation": "家長", "plans": []}], "storedAccounts": [{"id": "acc114", "pricePerUnit": 2600.0, "remainingUnits": 0, "topUps": []}]}, {"id": "fam_楊雅薰", "familyName": "楊雅薰", "note": "", "members": [{"id": "m_楊雅薰", "name": "楊雅薰", "relation": "學生", "plans": [{"courseType": "個別課", "prices": {"u05m25": "", "u1m50": "1800", "u1m60": "", "u15m80": ""}, "id": "plan115"}, {"courseType": "家長課", "prices": {"u05m25": "", "u1m50": "", "u1m60": "", "u15m80": "2400"}, "id": "plan116"}]}, {"id": "parent_fam_楊雅薰", "name": "家長", "relation": "家長", "plans": []}], "storedAccounts": []}, {"id": "fam_羅光臨", "familyName": "羅光臨", "note": "", "members": [{"id": "m_羅光臨", "name": "羅光臨", "relation": "學生", "plans": [{"courseType": "個別課", "prices": {"u05m25": "", "u1m50": "2080", "u1m60": "", "u15m80": ""}, "id": "plan117"}]}, {"id": "parent_fam_羅光臨", "name": "家長", "relation": "家長", "plans": []}], "storedAccounts": [{"id": "acc118", "pricePerUnit": 1920.0, "remainingUnits": 0, "topUps": []}]}, {"id": "fam_余子沐", "familyName": "余子沐", "note": "", "members": [{"id": "m_余子沐", "name": "余子沐", "relation": "學生", "plans": [{"courseType": "雙人團體/手足課", "prices": {"u05m25": "", "u1m50": "", "u1m60": "2400", "u15m80": ""}, "id": "plan119"}, {"courseType": "家長課", "prices": {"u05m25": "", "u1m50": "1000", "u1m60": "", "u15m80": ""}, "id": "plan120"}]}, {"id": "parent_fam_余子沐", "name": "家長", "relation": "家長", "plans": []}], "storedAccounts": []}, {"id": "fam_曹珮琪", "familyName": "曹珮琪", "note": "", "members": [{"id": "m_曹珮琪", "name": "曹珮琪", "relation": "學生", "plans": [{"courseType": "個別課", "prices": {"u05m25": "", "u1m50": "2000", "u1m60": "", "u15m80": ""}, "id": "plan121"}]}, {"id": "parent_fam_曹珮琪", "name": "家長", "relation": "家長", "plans": []}], "storedAccounts": [{"id": "acc122", "pricePerUnit": 2000.0, "remainingUnits": 0, "topUps": []}]}, {"id": "fam_許宸碩", "familyName": "許宸碩", "note": "", "members": [{"id": "m_許宸碩", "name": "許宸碩", "relation": "學生", "plans": [{"courseType": "個別課", "prices": {"u05m25": "", "u1m50": "2600", "u1m60": "", "u15m80": ""}, "id": "plan123"}]}, {"id": "parent_fam_許宸碩", "name": "家長", "relation": "家長", "plans": []}], "storedAccounts": [{"id": "acc124", "pricePerUnit": 2600.0, "remainingUnits": 0, "topUps": []}]}, {"id": "fam_蔡錦涵", "familyName": "蔡錦涵", "note": "", "members": [{"id": "m_蔡錦涵", "name": "蔡錦涵", "relation": "學生", "plans": [{"courseType": "個別課", "prices": {"u05m25": "", "u1m50": "1400", "u1m60": "", "u15m80": ""}, "id": "plan125"}]}, {"id": "parent_fam_蔡錦涵", "name": "家長", "relation": "家長", "plans": []}], "storedAccounts": []}, {"id": "fam_徐子宸", "familyName": "徐子宸", "note": "", "members": [{"id": "m_徐子宸", "name": "徐子宸", "relation": "學生", "plans": [{"courseType": "個別課", "prices": {"u05m25": "", "u1m50": "2600", "u1m60": "", "u15m80": ""}, "id": "plan126"}]}, {"id": "parent_fam_徐子宸", "name": "家長", "relation": "家長", "plans": []}], "storedAccounts": [{"id": "acc127", "pricePerUnit": 2600.0, "remainingUnits": 0, "topUps": []}]}, {"id": "fam_林雨嫺", "familyName": "林雨嫺", "note": "", "members": [{"id": "m_林雨嫺", "name": "林雨嫺", "relation": "學生", "plans": [{"courseType": "個別課", "prices": {"u05m25": "", "u1m50": "0", "u1m60": "", "u15m80": ""}, "id": "plan128"}]}, {"id": "parent_fam_林雨嫺", "name": "家長", "relation": "家長", "plans": []}], "storedAccounts": []}, {"id": "fam_曾禹晴", "familyName": "曾禹晴", "note": "", "members": [{"id": "m_曾禹晴", "name": "曾禹晴", "relation": "學生", "plans": [{"courseType": "個別課", "prices": {"u05m25": "", "u1m50": "2600", "u1m60": "", "u15m80": ""}, "id": "plan129"}]}, {"id": "parent_fam_曾禹晴", "name": "家長", "relation": "家長", "plans": []}], "storedAccounts": [{"id": "acc130", "pricePerUnit": 2600.0, "remainingUnits": 0, "topUps": []}]}, {"id": "fam_詹詠翔", "familyName": "詹詠翔", "note": "", "members": [{"id": "m_詹詠翔", "name": "詹詠翔", "relation": "學生", "plans": [{"courseType": "個別課", "prices": {"u05m25": "", "u1m50": "2600", "u1m60": "", "u15m80": ""}, "id": "plan131"}]}, {"id": "parent_fam_詹詠翔", "name": "家長", "relation": "家長", "plans": []}], "storedAccounts": [{"id": "acc132", "pricePerUnit": 2600.0, "remainingUnits": 0, "topUps": []}]}, {"id": "fam_王思穎", "familyName": "王思穎", "note": "", "members": [{"id": "m_王思穎", "name": "王思穎", "relation": "學生", "plans": [{"courseType": "個別課", "prices": {"u05m25": "", "u1m50": "2600", "u1m60": "", "u15m80": ""}, "id": "plan133"}]}, {"id": "parent_fam_王思穎", "name": "家長", "relation": "家長", "plans": []}], "storedAccounts": []}, {"id": "fam_尉遲澤羲", "familyName": "尉遲澤羲", "note": "", "members": [{"id": "m_尉遲澤羲", "name": "尉遲澤羲", "relation": "學生", "plans": [{"courseType": "個別課", "prices": {"u05m25": "", "u1m50": "2600", "u1m60": "", "u15m80": ""}, "id": "plan134"}]}, {"id": "parent_fam_尉遲澤羲", "name": "家長", "relation": "家長", "plans": []}], "storedAccounts": []}, {"id": "fam_黃鼎翔", "familyName": "黃鼎翔", "note": "", "members": [{"id": "m_黃鼎翔", "name": "黃鼎翔", "relation": "學生", "plans": [{"courseType": "個別課", "prices": {"u05m25": "", "u1m50": "2600", "u1m60": "", "u15m80": ""}, "id": "plan135"}]}, {"id": "parent_fam_黃鼎翔", "name": "家長", "relation": "家長", "plans": []}], "storedAccounts": [{"id": "acc136", "pricePerUnit": 2600.0, "remainingUnits": 0, "topUps": []}]}, {"id": "fam_呂秉宸", "familyName": "呂秉宸", "note": "", "members": [{"id": "m_呂秉宸", "name": "呂秉宸", "relation": "學生", "plans": [{"courseType": "個別課", "prices": {"u05m25": "", "u1m50": "2600", "u1m60": "", "u15m80": ""}, "id": "plan137"}]}, {"id": "parent_fam_呂秉宸", "name": "家長", "relation": "家長", "plans": []}], "storedAccounts": [{"id": "acc138", "pricePerUnit": 2600.0, "remainingUnits": 0, "topUps": []}]}, {"id": "fam_許粲朋", "familyName": "許粲朋", "note": "", "members": [{"id": "m_許粲朋", "name": "許粲朋", "relation": "學生", "plans": [{"courseType": "個別課", "prices": {"u05m25": "", "u1m50": "2600", "u1m60": "", "u15m80": ""}, "id": "plan139"}]}, {"id": "parent_fam_許粲朋", "name": "家長", "relation": "家長", "plans": []}], "storedAccounts": []}, {"id": "fam_張芷芸", "familyName": "張芷芸", "note": "", "members": [{"id": "m_張芷芸", "name": "張芷芸", "relation": "學生", "plans": [{"courseType": "團體課", "prices": {"u05m25": "", "u1m50": "", "u1m60": "", "u15m80": "1500"}, "id": "plan140"}]}, {"id": "parent_fam_張芷芸", "name": "家長", "relation": "家長", "plans": []}], "storedAccounts": [{"id": "acc141", "pricePerUnit": 1000.0, "remainingUnits": 0, "topUps": []}]}, {"id": "fam_郭祐榕", "familyName": "郭祐榕", "note": "", "members": [{"id": "m_郭祐榕", "name": "郭祐榕", "relation": "學生", "plans": [{"courseType": "個別課", "prices": {"u05m25": "", "u1m50": "2600", "u1m60": "", "u15m80": ""}, "id": "plan142"}]}, {"id": "parent_fam_郭祐榕", "name": "家長", "relation": "家長", "plans": []}], "storedAccounts": []}, {"id": "fam_李洋希", "familyName": "李洋希", "note": "", "members": [{"id": "m_李洋希", "name": "李洋希", "relation": "學生", "plans": [{"courseType": "個別課", "prices": {"u05m25": "", "u1m50": "2600", "u1m60": "", "u15m80": ""}, "id": "plan143"}]}, {"id": "parent_fam_李洋希", "name": "家長", "relation": "家長", "plans": []}], "storedAccounts": []}, {"id": "fam_科一凡", "familyName": "科一凡", "note": "", "members": [{"id": "m_科一凡", "name": "科一凡", "relation": "學生", "plans": [{"courseType": "個別課", "prices": {"u05m25": "", "u1m50": "2600", "u1m60": "", "u15m80": ""}, "id": "plan144"}]}, {"id": "parent_fam_科一凡", "name": "家長", "relation": "家長", "plans": []}], "storedAccounts": []}, {"id": "fam_林建杉", "familyName": "林建杉", "note": "", "members": [{"id": "m_林建杉", "name": "林建杉", "relation": "學生", "plans": [{"courseType": "個別課", "prices": {"u05m25": "", "u1m50": "2600", "u1m60": "", "u15m80": ""}, "id": "plan145"}]}, {"id": "parent_fam_林建杉", "name": "家長", "relation": "家長", "plans": []}], "storedAccounts": []}, {"id": "fam_許瑞恩", "familyName": "許瑞恩", "note": "", "members": [{"id": "m_許瑞恩", "name": "許瑞恩", "relation": "學生", "plans": [{"courseType": "個別課", "prices": {"u05m25": "", "u1m50": "2600", "u1m60": "", "u15m80": ""}, "id": "plan146"}]}, {"id": "parent_fam_許瑞恩", "name": "家長", "relation": "家長", "plans": []}], "storedAccounts": []}];


const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
const pad = (n) => String(n).padStart(2, "0");
const toDateStr = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const money = (n) => `NT$ ${Number(n || 0).toLocaleString()}`;
const timeToMinutes = (t) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
const todayStr = () => toDateStr(new Date());
const occurrenceIndexOfDate = (d) => Math.floor((d.getDate() - 1) / 7) + 1;
const weekPatternMatches = (occIndex, pattern) => {
  if (pattern === "every") return true;
  if (pattern === "odd") return occIndex % 2 === 1;
  if (pattern === "even") return occIndex % 2 === 0;
  if (pattern === "first") return occIndex === 1;
  if (pattern === "second") return occIndex === 2;
  if (pattern === "third") return occIndex === 3;
  if (pattern === "fourth") return occIndex === 4;
  return false;
};
const sessionRange = (session) => { const d = durationByKey(session.durationKey); const s = timeToMinutes(session.startTime); return [s, s + d.minutes]; };
const findConflicts = (session, daySessions) => {
  const [s1, e1] = sessionRange(session);
  return daySessions.filter((o) => o.id !== session.id).filter((o) => { const [s2, e2] = sessionRange(o); return s1 < e2 && s2 < e1; });
};

/* =========================================================
   共用樣式 / 元件
========================================================= */
function Modal({ title, onClose, children, width = 480 }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(30,27,20,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 16 }} onClick={onClose}>
      <div style={{ background: "#FFFDF9", borderRadius: 16, width: "100%", maxWidth: width, maxHeight: "88vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.25)", border: "1px solid #EDE6D6" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 20px", borderBottom: "1px solid #EDE6D6", position: "sticky", top: 0, background: "#FFFDF9", borderRadius: "16px 16px 0 0" }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#2E2A22" }}>{title}</h3>
          <button onClick={onClose} style={{ border: "none", background: "transparent", cursor: "pointer", color: "#8A8272", padding: 4 }}><X size={20} /></button>
        </div>
        <div style={{ padding: 20 }}>{children}</div>
      </div>
    </div>
  );
}
function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#5C5648", marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  );
}
const inputStyle = { width: "100%", padding: "9px 11px", borderRadius: 9, border: "1px solid #DED5BF", fontSize: 14, boxSizing: "border-box", background: "#fff", color: "#2E2A22" };
const btnBase = { border: "none", borderRadius: 9, padding: "9px 16px", fontSize: 14, fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 };
const btnPrimary = { ...btnBase, background: "#B4694A", color: "#fff" };
const btnGhost = { ...btnBase, background: "#F2ECDE", color: "#5C5648" };
const btnDanger = { ...btnBase, background: "#FDECEC", color: "#B4302A" };
const btnSm = { fontSize: 12, padding: "5px 9px" };
const warnBox = (bad) => ({ fontSize: 12, background: bad ? "#FDECEC" : "#EEF6EE", color: bad ? "#B4302A" : "#2F7A3B", padding: "7px 11px", borderRadius: 8, marginBottom: 10, display: "flex", gap: 6, alignItems: "flex-start" });

/* =========================================================
   成員課程收費方案編輯器（4 種堂數／時長）
========================================================= */
function PlansEditor({ plans, onChange }) {
  const addPlan = () => onChange([...plans, { id: uid(), courseType: COURSE_TYPES[0].key, prices: emptyPrices() }]);
  const updatePlan = (id, patch) => onChange(plans.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  const removePlan = (id) => onChange(plans.filter((p) => p.id !== id));
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#5C5648" }}>課程與收費設定</span>
        <button style={{ ...btnGhost, ...btnSm }} onClick={addPlan}><Plus size={12} />新增課程</button>
      </div>
      {plans.length === 0 && <div style={{ fontSize: 12, color: "#B7B0A0", marginBottom: 8 }}>尚未設定課程</div>}
      {plans.map((p) => {
        const ci = courseInfo(p.courseType);
        return (
          <div key={p.id} style={{ border: `1px solid ${ci.border}55`, background: ci.bg + "44", borderRadius: 10, padding: 12, marginBottom: 10 }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <select style={{ ...inputStyle, flex: 1 }} value={p.courseType} onChange={(e) => updatePlan(p.id, { courseType: e.target.value })}>
                {COURSE_TYPES.map((c) => <option key={c.key} value={c.key}>{c.key}</option>)}
              </select>
              <button style={{ ...btnDanger, ...btnSm }} onClick={() => removePlan(p.id)}><Trash2 size={12} /></button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {DURATIONS.map((d) => (
                <div key={d.key}>
                  <label style={{ fontSize: 11, color: "#8A8272" }}>{d.label}</label>
                  <input style={inputStyle} type="number" value={p.prices?.[d.key] ?? ""} onChange={(e) => updatePlan(p.id, { prices: { ...(p.prices || emptyPrices()), [d.key]: e.target.value } })} placeholder="NT$" />
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* =========================================================
   家庭表單（家庭 + 成員 + 課程方案 + 儲值帳戶）
========================================================= */
function TopUpForm({ account, onAdd, onCancel }) {
  const [amount, setAmount] = useState("");
  const [units, setUnits] = useState("");
  const [date, setDate] = useState(todayStr());
  const [method, setMethod] = useState("現金");
  const [last5, setLast5] = useState("");
  const [invoiced, setInvoiced] = useState(false);

  const autoUnits = () => {
    if (amount && account.pricePerUnit) return (Number(amount) / Number(account.pricePerUnit)).toFixed(2).replace(/\.00$/, "");
    return "";
  };
  const submit = () => {
    const u = Number(units || autoUnits() || 0);
    onAdd({ id: uid(), date, amount: Number(amount) || 0, units: u, method, last5: method === "匯款" ? last5 : "", invoiced });
  };
  return (
    <div>
      <div style={{ fontSize: 12, color: "#8A8272", marginBottom: 10 }}>此帳戶單堂價格：{money(account.pricePerUnit)}／堂　目前餘額：{account.remainingUnits ?? 0} 堂</div>
      <Field label="儲值金額（NT$）"><input style={inputStyle} type="number" value={amount} onChange={(e) => { setAmount(e.target.value); setUnits(""); }} /></Field>
      <Field label="增加堂數（可依金額自動換算，亦可手動調整）"><input style={inputStyle} type="number" value={units || autoUnits()} onChange={(e) => setUnits(e.target.value)} /></Field>
      <Field label="繳費日期"><input style={inputStyle} type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
      <Field label="付款方式">
        <select style={inputStyle} value={method} onChange={(e) => setMethod(e.target.value)}>
          {PAYMENT_METHOD_TYPES.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
      </Field>
      {method === "匯款" && (
        <Field label="匯款帳號末五碼"><input style={inputStyle} maxLength={5} value={last5} onChange={(e) => setLast5(e.target.value.replace(/\D/g, "").slice(0, 5))} placeholder="12345" /></Field>
      )}
      <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, marginBottom: 10, cursor: "pointer" }}>
        <input type="checkbox" checked={invoiced} onChange={(e) => setInvoiced(e.target.checked)} />已開立發票
      </label>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 14 }}>
        <button style={btnGhost} onClick={onCancel}>取消</button>
        <button style={btnPrimary} onClick={submit}><Save size={14} />確認儲值</button>
      </div>
    </div>
  );
}

function StoredAccountsEditor({ family, onCreate, onTopUp, onDelete }) {
  const [topUpFor, setTopUpFor] = useState(null);
  const [newPrice, setNewPrice] = useState("");
  const accounts = family.storedAccounts || [];
  const handleDelete = (acc) => {
    if ((acc.remainingUnits ?? 0) > 0) {
      if (!window.confirm(`此帳戶還有剩餘 ${acc.remainingUnits} 堂尚未使用，確定要刪除嗎？刪除後無法復原。`)) return;
    }
    onDelete(acc.id);
  };
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#5C5648" }}>儲值帳戶（全家共用，價位相同課程可共用）</span>
      </div>
      {accounts.length === 0 && <div style={{ fontSize: 12, color: "#B7B0A0", marginBottom: 8 }}>尚無儲值帳戶</div>}
      {accounts.map((acc) => (
        <div key={acc.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#F3EEE0", borderRadius: 9, padding: "8px 12px", marginBottom: 8 }}>
          <div style={{ fontSize: 13 }}>
            <div style={{ fontWeight: 700 }}>單堂 {money(acc.pricePerUnit)}</div>
            <div style={{ color: "#8A8272", fontSize: 12 }}>剩餘 {acc.remainingUnits ?? 0} 堂　累計儲值 {(acc.topUps || []).length} 筆</div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button style={{ ...btnGhost, ...btnSm }} onClick={() => setTopUpFor(acc)}><Wallet size={12} />儲值</button>
            <button style={{ ...btnDanger, ...btnSm }} onClick={() => handleDelete(acc)}><Trash2 size={12} /></button>
          </div>
        </div>
      ))}
      <div style={{ display: "flex", gap: 8 }}>
        <input style={inputStyle} type="number" placeholder="新帳戶單堂價格 NT$" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} />
        <button style={btnGhost} onClick={() => { if (Number(newPrice) > 0) { onCreate(Number(newPrice)); setNewPrice(""); } }}><Plus size={14} />新增帳戶</button>
      </div>
      {topUpFor && (
        <Modal title="儲值" onClose={() => setTopUpFor(null)}>
          <TopUpForm account={topUpFor} onCancel={() => setTopUpFor(null)} onAdd={(rec) => { onTopUp(topUpFor.id, rec); setTopUpFor(null); }} />
        </Modal>
      )}
    </div>
  );
}

function FamilyForm({ initial, onSave, onCancel }) {
  const [familyName, setFamilyName] = useState(initial?.familyName || "");
  const [note, setNote] = useState(initial?.note || "");
  const [members, setMembers] = useState(initial?.members || []);
  const [storedAccounts, setStoredAccounts] = useState(initial?.storedAccounts || []);

  const addMember = () => setMembers([...members, { id: uid(), name: "", relation: "學生", plans: [] }]);
  const updateMember = (id, patch) => setMembers(members.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  const removeMember = (id) => setMembers(members.filter((m) => m.id !== id));

  const createAccount = (pricePerUnit) => setStoredAccounts([...storedAccounts, { id: uid(), pricePerUnit, remainingUnits: 0, topUps: [] }]);
  const topUpAccount = (accId, rec) => setStoredAccounts(storedAccounts.map((a) => (a.id === accId ? { ...a, remainingUnits: (a.remainingUnits ?? 0) + rec.units, topUps: [...(a.topUps || []), rec] } : a)));
  const deleteAccount = (accId) => setStoredAccounts(storedAccounts.filter((a) => a.id !== accId));

  const submit = () => {
    if (!familyName.trim()) return;
    const cleaned = members.filter((m) => m.name.trim());
    onSave({ id: initial?.id || uid(), familyName: familyName.trim(), note, members: cleaned, storedAccounts });
  };

  return (
    <div>
      <Field label="家庭名稱 *"><input style={inputStyle} value={familyName} onChange={(e) => setFamilyName(e.target.value)} placeholder="例如：陳家" /></Field>
      <Field label="備註"><input style={inputStyle} value={note} onChange={(e) => setNote(e.target.value)} placeholder="選填" /></Field>

      <div style={{ marginTop: 16, marginBottom: 16, paddingBottom: 16, borderBottom: "1px solid #EDE6D6" }}>
        <StoredAccountsEditor family={{ storedAccounts }} onCreate={createAccount} onTopUp={topUpAccount} onDelete={deleteAccount} />
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{ fontWeight: 700, fontSize: 14 }}>家庭成員</span>
        <button style={btnGhost} onClick={addMember}><UserPlus size={14} />新增成員</button>
      </div>
      {members.length === 0 && <div style={{ fontSize: 13, color: "#9A9284", marginBottom: 10 }}>請至少新增一位成員（例如學生本人）。</div>}
      {members.map((m) => (
        <div key={m.id} style={{ border: "1px solid #EDE6D6", borderRadius: 12, padding: 14, marginBottom: 12, background: "#FBF8F1" }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <input style={{ ...inputStyle, flex: 2 }} value={m.name} onChange={(e) => updateMember(m.id, { name: e.target.value })} placeholder="成員姓名" />
            <select style={{ ...inputStyle, flex: 1 }} value={m.relation} onChange={(e) => updateMember(m.id, { relation: e.target.value })}>
              {RELATIONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            <button style={btnDanger} onClick={() => removeMember(m.id)}><Trash2 size={14} /></button>
          </div>
          <PlansEditor plans={m.plans} onChange={(plans) => updateMember(m.id, { plans })} />
        </div>
      ))}

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 18 }}>
        <button style={btnGhost} onClick={onCancel}>取消</button>
        <button style={btnPrimary} onClick={submit}><Save size={14} />儲存</button>
      </div>
    </div>
  );
}

/* =========================================================
   時段（單次）表單：時間 / 堂數 / 課別 / 實體或線上
========================================================= */
function SlotTimeForm({ date, initial, conflictCandidates, onSave, onCancel }) {
  const [startTime, setStartTime] = useState(initial?.startTime || "10:00");
  const [durationKey, setDurationKey] = useState(initial?.durationKey || "u1m50");
  const [courseType, setCourseType] = useState(initial?.courseType || "");
  const [mode, setMode] = useState(initial?.mode || "實體");

  const preview = { id: initial?.id || "__new__", startTime, durationKey };
  const conflicts = findConflicts(preview, conflictCandidates);

  const submit = () => onSave({ startTime, durationKey, courseType: courseType || null, mode });

  return (
    <div>
      <div style={{ fontSize: 13, color: "#8A8272", marginBottom: 12 }}>日期：{date}</div>
      <div style={{ display: "flex", gap: 8 }}>
        <Field label="開始時間"><input style={inputStyle} type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} /></Field>
        <Field label="堂數／時長">
          <select style={inputStyle} value={durationKey} onChange={(e) => setDurationKey(e.target.value)}>
            {DURATIONS.map((d) => <option key={d.key} value={d.key}>{d.label}</option>)}
          </select>
        </Field>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <Field label="課程類型（可不限）">
          <select style={inputStyle} value={courseType} onChange={(e) => setCourseType(e.target.value)}>
            <option value="">不限課程類型</option>
            {COURSE_TYPES.map((c) => <option key={c.key} value={c.key}>{c.key}</option>)}
          </select>
        </Field>
        <Field label="上課方式">
          <select style={inputStyle} value={mode} onChange={(e) => setMode(e.target.value)}>
            {MODES.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </Field>
      </div>
      {conflicts.length > 0 && (
        <div style={warnBox(true)}>
          <AlertTriangle size={14} style={{ marginTop: 1 }} />
          <span>衝堂提醒：此時段與 {conflicts.map((c) => `${c.startTime}${c.courseType ? "／" + c.courseType : ""}`).join("、")} 重疊，同一時段建議僅安排一堂課。</span>
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 14 }}>
        <button style={btnGhost} onClick={onCancel}>取消</button>
        <button style={btnPrimary} onClick={submit}><Save size={14} />儲存</button>
      </div>
    </div>
  );
}

/* =========================================================
   新增上課者（登記家庭成員參與此時段，含收費與繳費紀錄）
========================================================= */
/* =========================================================
   編輯上課者內容（課程類型／費用／付款方式）
========================================================= */
function EditAttendeeForm({ session, attendee, family, onSave, onCancel }) {
  const member = family?.members.find((m) => m.id === attendee.memberId);
  const [courseType, setCourseType] = useState(attendee.courseType || COURSE_TYPES[0].key);
  const [fee, setFee] = useState(attendee.fee ?? 0);
  const [paymentMode, setPaymentMode] = useState(attendee.paymentMode || "單次");
  const [storedAccountId, setStoredAccountId] = useState(attendee.storedAccountId || "");
  const duration = durationByKey(session.durationKey);

  const matchingAccounts = useMemo(() => {
    if (!family) return [];
    const feeNum = Number(fee) || 0;
    const pricePerUnit = duration.unit ? feeNum / duration.unit : 0;
    return (family.storedAccounts || []).map((a) => ({ ...a, matches: Math.abs(a.pricePerUnit - pricePerUnit) < 0.01 }));
  }, [family, fee]); // eslint-disable-line

  const chosenAccount = matchingAccounts.find((a) => a.id === storedAccountId);

  const submit = () => {
    if (paymentMode === "儲值" && !storedAccountId) return;
    onSave({
      courseType,
      fee: Number(fee) || 0,
      paymentMode,
      storedAccountId: paymentMode === "儲值" ? storedAccountId : null,
    });
  };

  return (
    <div>
      <div style={{ fontSize: 13, color: "#8A8272", marginBottom: 12 }}>上課者：{member?.name || "（已刪除）"}</div>
      <Field label="課程類型">
        <select style={inputStyle} value={courseType} onChange={(e) => setCourseType(e.target.value)}>
          {COURSE_TYPES.map((c) => <option key={c.key} value={c.key}>{c.key}</option>)}
        </select>
      </Field>
      <Field label="本次費用（NT$）"><input style={inputStyle} type="number" value={fee} onChange={(e) => setFee(e.target.value)} /></Field>
      <Field label="繳費方式">
        <div style={{ display: "flex", gap: 8 }}>
          <button style={{ ...btnBase, flex: 1, justifyContent: "center", background: paymentMode === "單次" ? "#B4694A" : "#F2ECDE", color: paymentMode === "單次" ? "#fff" : "#5C5648" }} onClick={() => setPaymentMode("單次")}>單次繳費</button>
          <button style={{ ...btnBase, flex: 1, justifyContent: "center", background: paymentMode === "儲值" ? "#B4694A" : "#F2ECDE", color: paymentMode === "儲值" ? "#fff" : "#5C5648" }} onClick={() => setPaymentMode("儲值")}>使用儲值</button>
        </div>
      </Field>
      {paymentMode === "儲值" && family && (
        <Field label="選擇儲值帳戶（單堂價格需相符，價位相同的課程可共用）">
          {matchingAccounts.length === 0 && <div style={{ fontSize: 12, color: "#B4302A" }}>此家庭尚無儲值帳戶，請先至家庭管理新增。</div>}
          {matchingAccounts.map((a) => (
            <label key={a.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, marginBottom: 6, padding: "6px 8px", borderRadius: 8, background: a.id === storedAccountId ? "#FBEFE7" : "#F7F5EF", cursor: "pointer" }}>
              <input type="radio" name="editacc" checked={a.id === storedAccountId} onChange={() => setStoredAccountId(a.id)} />
              單堂 {money(a.pricePerUnit)}｜剩餘 {a.remainingUnits ?? 0} 堂 {a.matches ? "（價位相符）" : "（價位不同，請確認）"}
            </label>
          ))}
          {chosenAccount && (chosenAccount.remainingUnits ?? 0) < duration.unit && attendee.attendance === "出席" && (
            <div style={warnBox(true)}><AlertCircle size={14} />此帳戶剩餘堂數可能不足（{duration.unit} 堂）</div>
          )}
        </Field>
      )}
      {attendee.deducted && (
        <div style={warnBox(false)}><AlertCircle size={14} />此上課者原本已從儲值帳戶扣過堂數，若更改繳費方式或帳戶，系統會自動退回原帳戶，並依新設定重新處理。</div>
      )}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 14 }}>
        <button style={btnGhost} onClick={onCancel}>取消</button>
        <button style={btnPrimary} onClick={submit}><Save size={14} />儲存</button>
      </div>
    </div>
  );
}

function AddAttendeeForm({ session, families, onAdd, onCancel }) {
  const [familyId, setFamilyId] = useState("");
  const [memberId, setMemberId] = useState("");
  const [planId, setPlanId] = useState("");
  const [fee, setFee] = useState("");
  const [paymentMode, setPaymentMode] = useState("單次");
  const [storedAccountId, setStoredAccountId] = useState("");
  const [paid, setPaid] = useState(false);
  const [paidDate, setPaidDate] = useState(todayStr());
  const [method, setMethod] = useState("現金");
  const [last5, setLast5] = useState("");
  const [invoiced, setInvoiced] = useState(false);

  const family = families.find((f) => f.id === familyId);
  const members = family?.members || [];
  const member = members.find((m) => m.id === memberId);
  const plan = member?.plans.find((p) => p.id === planId);
  const duration = durationByKey(session.durationKey);

  useEffect(() => {
    if (plan) {
      const auto = plan.prices?.[session.durationKey];
      if (auto !== "" && auto !== undefined) setFee(auto);
    }
  }, [planId]); // eslint-disable-line

  const matchingAccounts = useMemo(() => {
    if (!family) return [];
    const feeNum = Number(fee) || 0;
    const pricePerUnit = duration.unit ? feeNum / duration.unit : 0;
    return (family.storedAccounts || []).map((a) => ({ ...a, matches: Math.abs(a.pricePerUnit - pricePerUnit) < 0.01 }));
  }, [family, fee]); // eslint-disable-line

  const chosenAccount = matchingAccounts.find((a) => a.id === storedAccountId);

  const submit = () => {
    if (!familyId || !memberId) return;
    const courseType = plan ? plan.courseType : (session.courseType || COURSE_TYPES[0].key);
    const base = { id: uid(), familyId, memberId, planId: planId || null, courseType, fee: Number(fee) || 0, paymentMode, attendance: null, deducted: false };
    if (paymentMode === "儲值") {
      if (!storedAccountId) return;
      onAdd({ ...base, storedAccountId });
    } else {
      onAdd({ ...base, paid, paidDate: paid ? paidDate : "", method: paid ? method : "", last5: paid && method === "匯款" ? last5 : "", invoiced });
    }
  };

  return (
    <div>
      <Field label="家庭 *">
        <select style={inputStyle} value={familyId} onChange={(e) => { setFamilyId(e.target.value); setMemberId(""); setPlanId(""); setStoredAccountId(""); }}>
          <option value="">請選擇家庭</option>
          {families.map((f) => <option key={f.id} value={f.id}>{f.familyName}</option>)}
        </select>
      </Field>
      {family && (
        <Field label="成員 *">
          <select style={inputStyle} value={memberId} onChange={(e) => { setMemberId(e.target.value); setPlanId(""); }}>
            <option value="">請選擇成員</option>
            {members.map((m) => <option key={m.id} value={m.id}>{m.name}（{m.relation}）</option>)}
          </select>
        </Field>
      )}
      {member && (
        <Field label="課程方案（用於帶入費用）">
          <select style={inputStyle} value={planId} onChange={(e) => setPlanId(e.target.value)}>
            <option value="">自訂（不套用方案）</option>
            {member.plans.map((p) => <option key={p.id} value={p.id}>{p.courseType}</option>)}
          </select>
        </Field>
      )}
      <Field label="本次費用（NT$）"><input style={inputStyle} type="number" value={fee} onChange={(e) => setFee(e.target.value)} placeholder="套用方案後自動帶入，可手動調整" /></Field>

      <Field label="繳費方式">
        <div style={{ display: "flex", gap: 8 }}>
          <button style={{ ...btnBase, flex: 1, justifyContent: "center", background: paymentMode === "單次" ? "#B4694A" : "#F2ECDE", color: paymentMode === "單次" ? "#fff" : "#5C5648" }} onClick={() => setPaymentMode("單次")}>單次繳費</button>
          <button style={{ ...btnBase, flex: 1, justifyContent: "center", background: paymentMode === "儲值" ? "#B4694A" : "#F2ECDE", color: paymentMode === "儲值" ? "#fff" : "#5C5648" }} onClick={() => setPaymentMode("儲值")}>使用儲值</button>
        </div>
      </Field>

      {paymentMode === "儲值" && family && (
        <Field label="選擇儲值帳戶（單堂價格需相符，價位相同的課程可共用）">
          {matchingAccounts.length === 0 && <div style={{ fontSize: 12, color: "#B4302A" }}>此家庭尚無儲值帳戶，請先至家庭管理新增。</div>}
          {matchingAccounts.map((a) => (
            <label key={a.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, marginBottom: 6, padding: "6px 8px", borderRadius: 8, background: a.id === storedAccountId ? "#FBEFE7" : "#F7F5EF", cursor: "pointer" }}>
              <input type="radio" name="acc" checked={a.id === storedAccountId} onChange={() => setStoredAccountId(a.id)} />
              單堂 {money(a.pricePerUnit)}｜剩餘 {a.remainingUnits ?? 0} 堂 {a.matches ? "（價位相符）" : "（價位不同，請確認）"}
            </label>
          ))}
          {chosenAccount && (chosenAccount.remainingUnits ?? 0) < duration.unit && (
            <div style={warnBox(true)}><AlertCircle size={14} />此帳戶剩餘堂數可能不足（{duration.unit} 堂）。堂數會在標記「出席」後才扣除，先加入不會馬上扣款。</div>
          )}
        </Field>
      )}

      {paymentMode === "單次" && (
        <>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, marginBottom: 10, cursor: "pointer" }}>
            <input type="checkbox" checked={paid} onChange={(e) => setPaid(e.target.checked)} />已收費
          </label>
          {paid && (
            <>
              <Field label="繳費日期"><input style={inputStyle} type="date" value={paidDate} onChange={(e) => setPaidDate(e.target.value)} /></Field>
              <Field label="付款方式">
                <select style={inputStyle} value={method} onChange={(e) => setMethod(e.target.value)}>
                  {PAYMENT_METHOD_TYPES.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </Field>
              {method === "匯款" && <Field label="匯款帳號末五碼"><input style={inputStyle} maxLength={5} value={last5} onChange={(e) => setLast5(e.target.value.replace(/\D/g, "").slice(0, 5))} placeholder="12345" /></Field>}
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, marginBottom: 10, cursor: "pointer" }}>
                <input type="checkbox" checked={invoiced} onChange={(e) => setInvoiced(e.target.checked)} />已開立發票
              </label>
            </>
          )}
        </>
      )}

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 14 }}>
        <button style={btnGhost} onClick={onCancel}>取消</button>
        <button style={btnPrimary} onClick={submit}><Save size={14} />加入</button>
      </div>
    </div>
  );
}

/* =========================================================
   繳費資訊編輯（單次繳費 attendee 的詳細資料）
========================================================= */
function PaymentDetailForm({ attendee, onSave, onCancel }) {
  const [paid, setPaid] = useState(!!attendee.paid);
  const [paidDate, setPaidDate] = useState(attendee.paidDate || todayStr());
  const [method, setMethod] = useState(attendee.method || "現金");
  const [last5, setLast5] = useState(attendee.last5 || "");
  const [invoiced, setInvoiced] = useState(!!attendee.invoiced);
  const submit = () => onSave({ paid, paidDate: paid ? paidDate : "", method: paid ? method : "", last5: paid && method === "匯款" ? last5 : "", invoiced });
  return (
    <div>
      <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, marginBottom: 12, cursor: "pointer" }}>
        <input type="checkbox" checked={paid} onChange={(e) => setPaid(e.target.checked)} />已收費
      </label>
      {paid && (
        <>
          <Field label="繳費日期"><input style={inputStyle} type="date" value={paidDate} onChange={(e) => setPaidDate(e.target.value)} /></Field>
          <Field label="付款方式">
            <select style={inputStyle} value={method} onChange={(e) => setMethod(e.target.value)}>
              {PAYMENT_METHOD_TYPES.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </Field>
          {method === "匯款" && <Field label="匯款帳號末五碼"><input style={inputStyle} maxLength={5} value={last5} onChange={(e) => setLast5(e.target.value.replace(/\D/g, "").slice(0, 5))} /></Field>}
        </>
      )}
      <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, marginBottom: 10, cursor: "pointer" }}>
        <input type="checkbox" checked={invoiced} onChange={(e) => setInvoiced(e.target.checked)} />已開立發票
      </label>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 14 }}>
        <button style={btnGhost} onClick={onCancel}>取消</button>
        <button style={btnPrimary} onClick={submit}><Save size={14} />儲存</button>
      </div>
    </div>
  );
}

/* =========================================================
   固定課程（週期性排課樣板）表單
========================================================= */
function RecurringAttendeeRow({ row, families, onChange, onRemove }) {
  const family = families.find((f) => f.id === row.familyId);
  const members = family?.members || [];
  const member = members.find((m) => m.id === row.memberId);
  return (
    <div style={{ display: "flex", gap: 6, marginBottom: 8, alignItems: "center" }}>
      <select style={{ ...inputStyle, flex: 1 }} value={row.familyId} onChange={(e) => onChange({ ...row, familyId: e.target.value, memberId: "", planId: "" })}>
        <option value="">選擇家庭</option>
        {families.map((f) => <option key={f.id} value={f.id}>{f.familyName}</option>)}
      </select>
      <select style={{ ...inputStyle, flex: 1 }} value={row.memberId} onChange={(e) => onChange({ ...row, memberId: e.target.value, planId: "" })} disabled={!family}>
        <option value="">選擇成員</option>
        {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
      </select>
      <select style={{ ...inputStyle, flex: 1 }} value={row.planId} onChange={(e) => onChange({ ...row, planId: e.target.value })} disabled={!member}>
        <option value="">課程方案（選填）</option>
        {member?.plans.map((p) => <option key={p.id} value={p.id}>{p.courseType}</option>)}
      </select>
      <button style={{ ...btnDanger, ...btnSm }} onClick={onRemove}><Trash2 size={12} /></button>
    </div>
  );
}

function RecurringTemplateForm({ initial, families, onSave, onCancel }) {
  const [name, setName] = useState(initial?.name || "");
  const [courseType, setCourseType] = useState(initial?.courseType || COURSE_TYPES[3].key);
  const [mode, setMode] = useState(initial?.mode || "實體");
  const [dayOfWeek, setDayOfWeek] = useState(initial?.dayOfWeek ?? 1);
  const [weekPattern, setWeekPattern] = useState(initial?.weekPattern || "every");
  const [startTime, setStartTime] = useState(initial?.startTime || "10:00");
  const [durationKey, setDurationKey] = useState(initial?.durationKey || "u1m50");
  const [startDate, setStartDate] = useState(initial?.startDate || todayStr());
  const [endDate, setEndDate] = useState(initial?.endDate || "");
  const [attendees, setAttendees] = useState(initial?.attendees || []);

  const addRow = () => setAttendees([...attendees, { id: uid(), familyId: "", memberId: "", planId: "" }]);
  const updateRow = (id, next) => setAttendees(attendees.map((r) => (r.id === id ? next : r)));
  const removeRow = (id) => setAttendees(attendees.filter((r) => r.id !== id));

  const submit = () => {
    const cleaned = attendees.filter((a) => a.familyId && a.memberId);
    if (endDate && endDate < startDate) return;
    onSave({
      id: initial?.id || uid(), name, courseType, mode, dayOfWeek: Number(dayOfWeek), weekPattern,
      startTime, durationKey, startDate, endDate: endDate || null, attendees: cleaned, cancelledDates: initial?.cancelledDates || [], active: true,
    });
  };

  return (
    <div>
      <Field label="課程名稱（選填，例如：週三團體班）"><input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} /></Field>
      <div style={{ display: "flex", gap: 8 }}>
        <Field label="課程類型">
          <select style={inputStyle} value={courseType} onChange={(e) => setCourseType(e.target.value)}>
            {COURSE_TYPES.map((c) => <option key={c.key} value={c.key}>{c.key}</option>)}
          </select>
        </Field>
        <Field label="上課方式">
          <select style={inputStyle} value={mode} onChange={(e) => setMode(e.target.value)}>
            {MODES.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </Field>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <Field label="星期">
          <select style={inputStyle} value={dayOfWeek} onChange={(e) => setDayOfWeek(e.target.value)}>
            {WEEKDAY_FULL.map((w, i) => <option key={i} value={i}>{w}</option>)}
          </select>
        </Field>
        <Field label="頻率">
          <select style={inputStyle} value={weekPattern} onChange={(e) => setWeekPattern(e.target.value)}>
            {WEEK_PATTERNS.map((w) => <option key={w.key} value={w.key}>{w.label}</option>)}
          </select>
        </Field>
      </div>
      <div style={{ fontSize: 12, color: "#8A8272", marginTop: -8, marginBottom: 14 }}>
        單週＝每月該星期的第 1、3 次；雙週＝第 2、4 次；每週＝每次都上課；也可指定僅第一/二/三/四週上課（例如每月第三個星期日）。
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <Field label="開始時間"><input style={inputStyle} type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} /></Field>
        <Field label="堂數／時長">
          <select style={inputStyle} value={durationKey} onChange={(e) => setDurationKey(e.target.value)}>
            {DURATIONS.map((d) => <option key={d.key} value={d.key}>{d.label}</option>)}
          </select>
        </Field>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <Field label="課程開始日期"><input style={inputStyle} type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></Field>
        <Field label="課程結束日期（選填，不填則持續進行）"><input style={inputStyle} type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} min={startDate} /></Field>
      </div>
      {endDate && endDate < startDate && (
        <div style={warnBox(true)}><AlertCircle size={14} />結束日期不可早於開始日期</div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14, marginBottom: 8 }}>
        <span style={{ fontWeight: 700, fontSize: 14 }}>固定上課學員</span>
        <button style={{ ...btnGhost, ...btnSm }} onClick={addRow}><Plus size={12} />新增學員</button>
      </div>
      {attendees.length === 0 && <div style={{ fontSize: 12, color: "#B7B0A0", marginBottom: 8 }}>尚未設定學員</div>}
      {attendees.map((row) => <RecurringAttendeeRow key={row.id} row={row} families={families} onChange={(next) => updateRow(row.id, next)} onRemove={() => removeRow(row.id)} />)}

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 18 }}>
        <button style={btnGhost} onClick={onCancel}>取消</button>
        <button style={btnPrimary} onClick={submit}><Save size={14} />儲存固定課程</button>
      </div>
    </div>
  );
}

/* =========================================================
   主應用
========================================================= */
/* =========================================================
   登入畫面
========================================================= */
function LoginScreen({ onLoggedIn }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) { setError("帳號或密碼錯誤，請再試一次"); return; }
    onLoggedIn();
  };

  return (
    <div style={{ fontFamily: "'Noto Sans TC', system-ui, sans-serif", background: "#FBF8F1", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <form onSubmit={submit} style={{ background: "#fff", borderRadius: 16, border: "1px solid #EDE6D6", padding: 32, width: "100%", maxWidth: 380, boxShadow: "0 12px 32px rgba(0,0,0,0.06)" }}>
        <h1 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 800, color: "#2E2A22" }}>工作室個案管理系統</h1>
        <div style={{ fontSize: 13, color: "#9A9284", marginBottom: 24 }}>請登入以繼續</div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#5C5648", marginBottom: 6 }}>帳號（Email）</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            style={{ width: "100%", padding: "10px 12px", borderRadius: 9, border: "1px solid #DED5BF", fontSize: 14, boxSizing: "border-box" }} />
        </div>
        <div style={{ marginBottom: 18 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#5C5648", marginBottom: 6 }}>密碼</label>
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
            style={{ width: "100%", padding: "10px 12px", borderRadius: 9, border: "1px solid #DED5BF", fontSize: 14, boxSizing: "border-box" }} />
        </div>
        {error && <div style={{ background: "#FDECEC", color: "#B4302A", padding: "8px 12px", borderRadius: 8, fontSize: 13, marginBottom: 14 }}>{error}</div>}
        <button type="submit" disabled={loading}
          style={{ width: "100%", border: "none", borderRadius: 9, padding: "11px 16px", fontSize: 15, fontWeight: 700, cursor: loading ? "default" : "pointer", background: "#B4694A", color: "#fff", opacity: loading ? 0.7 : 1 }}>
          {loading ? "登入中…" : "登入"}
        </button>
      </form>
    </div>
  );
}

/* =========================================================
   最外層：登入驗證
========================================================= */
export default function App() {
  const [session, setSession] = useState(undefined); // undefined = 檢查中, null = 未登入, object = 已登入

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => setSession(newSession));
    return () => listener.subscription.unsubscribe();
  }, []);

  if (session === undefined) {
    return <div style={{ fontFamily: "'Noto Sans TC', system-ui, sans-serif", padding: 40, color: "#9A9284" }}>載入中…</div>;
  }
  if (!session) {
    return <LoginScreen onLoggedIn={() => {}} />;
  }
  return <StudioCRM onLogout={() => supabase.auth.signOut()} />;
}

function StudioCRM({ onLogout }) {
  const [families, setFamilies] = useState([]);
  const [slots, setSlots] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState("calendar");
  const [month, setMonth] = useState(() => { const d = new Date(); d.setDate(1); return d; });
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [familyModal, setFamilyModal] = useState(null);
  const [slotTimeModal, setSlotTimeModal] = useState(null);
  const [attendeeModalSessionId, setAttendeeModalSessionId] = useState(null);
  const [paymentEdit, setPaymentEdit] = useState(null); // { session, attendee }
  const [attendeeEdit, setAttendeeEdit] = useState(null); // { session, attendee }
  const [templateModal, setTemplateModal] = useState(null);
  const [saveError, setSaveError] = useState("");
  const [history, setHistory] = useState([]);
  const HISTORY_LIMIT = 20;
  const pushHistory = () => {
    setHistory((h) => {
      const snapshot = { families, slots, templates };
      const next = [...h, snapshot];
      return next.length > HISTORY_LIMIT ? next.slice(next.length - HISTORY_LIMIT) : next;
    });
  };
  const undo = () => {
    setHistory((h) => {
      if (h.length === 0) return h;
      const prev = h[h.length - 1];
      setFamilies(prev.families);
      setSlots(prev.slots);
      setTemplates(prev.templates);
      return h.slice(0, -1);
    });
  };

  // 以「補齊缺少項目」的方式合併匯入資料：只新增尚不存在的家庭／成員課程方案／固定課程，
  // 不會覆蓋或刪除任何已經存在（含手動編輯過）的資料。
  const mergeSeedFamilies = (existing, seed) => {
    const byId = new Map(existing.map((f) => [f.id, f]));
    seed.forEach((sf) => {
      const cur = byId.get(sf.id);
      if (!cur) { byId.set(sf.id, sf); return; }
      const memberById = new Map(cur.members.map((m) => [m.id, m]));
      sf.members.forEach((sm) => {
        const curM = memberById.get(sm.id);
        if (!curM) { memberById.set(sm.id, sm); return; }
        const existingCourseTypes = new Set(curM.plans.map((p) => p.courseType));
        const plansToAdd = sm.plans.filter((p) => !existingCourseTypes.has(p.courseType));
        if (plansToAdd.length) curM.plans = [...curM.plans, ...plansToAdd];
      });
      cur.members = Array.from(memberById.values());
      const accIds = new Set((cur.storedAccounts || []).map((a) => a.id));
      const accsToAdd = (sf.storedAccounts || []).filter((a) => !accIds.has(a.id));
      if (accsToAdd.length) cur.storedAccounts = [...(cur.storedAccounts || []), ...accsToAdd];
    });
    return Array.from(byId.values());
  };
  const mergeSeedTemplates = (existing, seed) => {
    const ids = new Set(existing.map((t) => t.id));
    return [...existing, ...seed.filter((t) => !ids.has(t.id))];
  };

  const loadFromServer = useCallback(async () => {
    try {
      const { data, error } = await supabase.from("studio_data").select("value").eq("id", "main").maybeSingle();
      if (error) throw error;
      const loadedFamilies = data?.value?.families || [];
      const loadedTemplates = data?.value?.templates || [];
      setFamilies(mergeSeedFamilies(loadedFamilies, SEED_FAMILIES));
      setTemplates(mergeSeedTemplates(loadedTemplates, SEED_TEMPLATES));
      setSlots(data?.value?.slots || []);
      setSaveError("");
    } catch (e) {
      setSaveError("讀取資料失敗，請確認網路連線與資料庫設定");
    }
  }, []);

  useEffect(() => {
    (async () => { await loadFromServer(); setLoaded(true); })();
  }, [loadFromServer]);

  const persist = useCallback(async (f, s, t) => {
    try {
      const { error } = await supabase.from("studio_data").upsert({ id: "main", value: { families: f, slots: s, templates: t }, updated_at: new Date().toISOString() });
      setSaveError(error ? "儲存失敗，請稍後再試" : "");
    } catch (e) { setSaveError("儲存失敗，請稍後再試"); }
  }, []);
  useEffect(() => { if (loaded) persist(families, slots, templates); }, [families, slots, templates, loaded]); // eslint-disable-line

  /* ---------- 查找工具 ---------- */
  const findMember = (familyId, memberId) => families.find((f) => f.id === familyId)?.members.find((m) => m.id === memberId);
  const findPlan = (familyId, memberId, planId) => findMember(familyId, memberId)?.plans.find((p) => p.id === planId);
  const memberLabel = (a) => {
    const fam = families.find((f) => f.id === a.familyId);
    const m = fam?.members.find((mm) => mm.id === a.memberId);
    return m ? `${fam.familyName}・${m.name}` : "（成員已刪除）";
  };
  const memberNameOnly = (a) => findMember(a.familyId, a.memberId)?.name || "（已刪除）";

  const adjustStoredAccount = (familyId, accountId, delta) => {
    setFamilies((prev) => prev.map((f) => (f.id !== familyId ? f : { ...f, storedAccounts: (f.storedAccounts || []).map((a) => (a.id === accountId ? { ...a, remainingUnits: (a.remainingUnits ?? 0) + delta } : a)) })));
  };

  /* ---------- 家庭 CRUD ---------- */
  const saveFamily = (family) => { pushHistory(); setFamilies((prev) => (prev.some((f) => f.id === family.id) ? prev.map((f) => (f.id === family.id ? family : f)) : [...prev, family])); setFamilyModal(null); };
  const deleteFamily = (id) => {
    pushHistory();
    setFamilies((prev) => prev.filter((f) => f.id !== id));
    setSlots((prev) => prev.map((s) => ({ ...s, attendees: s.attendees.filter((a) => a.familyId !== id) })));
    setTemplates((prev) => prev.map((t) => ({ ...t, attendees: t.attendees.filter((a) => a.familyId !== id) })));
  };

  /* ---------- 固定課程 CRUD ---------- */
  const saveTemplate = (tpl) => { pushHistory(); setTemplates((prev) => (prev.some((t) => t.id === tpl.id) ? prev.map((t) => (t.id === tpl.id ? tpl : t)) : [...prev, tpl])); setTemplateModal(null); };
  const deleteTemplate = (id) => { pushHistory(); setTemplates((prev) => prev.filter((t) => t.id !== id)); setSlots((prev) => prev.filter((s) => s.fromTemplateId !== id)); };
  const addCancelledDate = (templateId, dateStr) => setTemplates((prev) => prev.map((t) => (t.id === templateId ? { ...t, cancelledDates: [...(t.cancelledDates || []), dateStr] } : t)));

  /* ---------- 產生某天的所有時段（真實 + 虛擬固定課程） ---------- */
  const buildVirtualAttendee = (row, template) => {
    const plan = row.planId ? findPlan(row.familyId, row.memberId, row.planId) : null;
    const fee = plan ? Number(plan.prices?.[template.durationKey]) || 0 : 0;
    return { id: row.id, familyId: row.familyId, memberId: row.memberId, planId: row.planId || null, courseType: template.courseType, fee, paymentMode: "單次", paid: false, attendance: null, deducted: false };
  };

  const getDaySessions = useCallback((dateStr) => {
    const real = slots.filter((s) => s.date === dateStr);
    const dateObj = new Date(dateStr + "T00:00:00");
    const weekday = dateObj.getDay();
    const occIndex = occurrenceIndexOfDate(dateObj);
    const virtual = templates
      .filter((t) => t.active !== false && t.dayOfWeek === weekday && weekPatternMatches(occIndex, t.weekPattern))
      .filter((t) => (!t.startDate || dateStr >= t.startDate) && (!t.endDate || dateStr <= t.endDate))
      .filter((t) => !(t.cancelledDates || []).includes(dateStr))
      .filter((t) => !real.some((r) => r.fromTemplateId === t.id))
      .map((t) => ({
        id: `virtual-${t.id}-${dateStr}`, virtual: true, templateId: t.id, date: dateStr,
        startTime: t.startTime, durationKey: t.durationKey, courseType: t.courseType, mode: t.mode,
        name: t.name, attendees: t.attendees.map((row) => buildVirtualAttendee(row, t)),
      }));
    return [...real, ...virtual].sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [slots, templates, families]); // eslint-disable-line

  const buildRealFromVirtual = (session) => ({
    id: uid(), date: session.date, startTime: session.startTime, durationKey: session.durationKey,
    courseType: session.courseType, mode: session.mode, fromTemplateId: session.templateId,
    attendees: session.attendees.map((a) => ({ ...a })),
  });

  const withRealSession = (session, mutateFn) => {
    setSlots((prev) => {
      const idx = prev.findIndex((s) => s.id === session.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = mutateFn({ ...next[idx] }); return next; }
      const real = buildRealFromVirtual(session);
      return [...prev, mutateFn(real)];
    });
  };

  const createManualSession = (fields) => { pushHistory(); setSlots((prev) => [...prev, { id: uid(), date: selectedDate, attendees: [], ...fields }]); setSlotTimeModal(null); };
  const updateSessionTime = (session, fields) => { pushHistory(); withRealSession(session, (s) => ({ ...s, ...fields })); setSlotTimeModal(null); };

  const deleteSession = (session) => {
    pushHistory();
    session.attendees.forEach((a) => { if (a.deducted && a.storedAccountId) adjustStoredAccount(a.familyId, a.storedAccountId, durationByKey(session.durationKey).unit); });
    if (session.virtual) { addCancelledDate(session.templateId, session.date); }
    else { setSlots((prev) => prev.filter((s) => s.id !== session.id)); if (session.fromTemplateId) addCancelledDate(session.fromTemplateId, session.date); }
  };

  const addAttendee = (session, attendee) => {
    pushHistory();
    withRealSession(session, (s) => ({ ...s, attendees: [...s.attendees, attendee] }));
    setAttendeeModalSessionId(null);
  };
  const removeAttendee = (session, attendeeId) => {
    pushHistory();
    const att = session.attendees.find((a) => a.id === attendeeId);
    withRealSession(session, (s) => ({ ...s, attendees: s.attendees.filter((a) => a.id !== attendeeId) }));
    if (att && att.deducted && att.storedAccountId) adjustStoredAccount(att.familyId, att.storedAccountId, durationByKey(session.durationKey).unit);
  };
  const updateAttendeePayment = (session, attendeeId, patch) => { pushHistory(); withRealSession(session, (s) => ({ ...s, attendees: s.attendees.map((a) => (a.id === attendeeId ? { ...a, ...patch } : a)) })); };

  // 編輯上課者的課程類型／費用／繳費方式；若原本已扣過儲值堂數，先退回再依新設定重新處理
  const updateAttendeeDetails = (session, attendeeId, patch) => {
    pushHistory();
    const att = session.attendees.find((a) => a.id === attendeeId);
    if (!att) return;
    const unit = durationByKey(session.durationKey).unit;
    if (att.deducted && att.storedAccountId) adjustStoredAccount(att.familyId, att.storedAccountId, unit);
    let deducted = false;
    if (patch.paymentMode === "儲值" && patch.storedAccountId && att.attendance === "出席") {
      adjustStoredAccount(att.familyId, patch.storedAccountId, -unit);
      deducted = true;
    }
    const cleared = patch.paymentMode === "儲值" ? { paid: undefined, paidDate: undefined, method: undefined, last5: undefined, invoiced: undefined } : {};
    withRealSession(session, (s) => ({ ...s, attendees: s.attendees.map((a) => (a.id === attendeeId ? { ...a, ...patch, ...cleared, deducted } : a)) }));
    setAttendeeEdit(null);
  };

  // 標記出席狀態；若為儲值付款，出席時自動扣堂，取消出席則自動退還
  const setAttendeeAttendance = (session, attendeeId, status) => {
    pushHistory();
    const att = session.attendees.find((a) => a.id === attendeeId);
    if (!att) return;
    const wasDeducted = !!att.deducted;
    const willDeduct = status === "出席" && att.paymentMode === "儲值" && !!att.storedAccountId;
    withRealSession(session, (s) => ({ ...s, attendees: s.attendees.map((a) => (a.id === attendeeId ? { ...a, attendance: status, deducted: willDeduct } : a)) }));
    const unit = durationByKey(session.durationKey).unit;
    if (willDeduct && !wasDeducted) adjustStoredAccount(att.familyId, att.storedAccountId, -unit);
    else if (!willDeduct && wasDeducted) adjustStoredAccount(att.familyId, att.storedAccountId, unit);
  };

  /* ---------- 月曆計算 ---------- */
  const year = month.getFullYear(); const mon = month.getMonth();
  const startOffset = (new Date(year, mon, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, mon + 1, 0).getDate();
  const cells = []; for (let i = 0; i < startOffset; i++) cells.push(null); for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, mon, d));

  const daySessions = getDaySessions(selectedDate);

  /* ---------- 收費總覽統計 ---------- */
  const perSessionRows = useMemo(() => {
    const rows = [];
    slots.forEach((s) => s.attendees.forEach((a) => {
      if (a.paymentMode !== "儲值") rows.push({ sessionId: s.id, date: s.date, startTime: s.startTime, courseType: a.courseType, attendee: a });
    }));
    return rows.sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime));
  }, [slots]);

  const attendanceStats = useMemo(() => {
    const map = {};
    slots.forEach((s) => s.attendees.forEach((a) => {
      const key = `${a.familyId}__${a.memberId}__${a.courseType}`;
      if (!map[key]) map[key] = { familyId: a.familyId, memberId: a.memberId, courseType: a.courseType, sessionCount: 0, unitSum: 0, feeSum: 0 };
      map[key].sessionCount += 1; map[key].unitSum += durationByKey(s.durationKey).unit; map[key].feeSum += a.fee || 0;
    }));
    return Object.values(map);
  }, [slots]);

  const topUp = (familyId, planId) => {};

  const tabList = [["calendar", "月曆排課", Calendar], ["recurring", "固定課程", Repeat], ["families", "家庭與學生", Users], ["billing", "收費總覽", DollarSign]];

  return (
    <>
      <style>{`
        .print-calendar { display: none; }
        @media print {
          html, body { margin: 0; padding: 0; }
          .app-screen-view { display: none !important; }
          .print-calendar { display: block !important; }
          @page { size: A4 landscape; margin: 8mm; }
        }
      `}</style>
      <div className="app-screen-view" style={{ fontFamily: "'Noto Sans TC', system-ui, sans-serif", background: "#FBF8F1", minHeight: "100%", color: "#2E2A22", padding: 20 }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18, flexWrap: "wrap", gap: 10 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>工作室個案管理系統</h1>
            <div style={{ fontSize: 13, color: "#9A9284", marginTop: 2 }}>家庭・固定課程・排課・收費一站管理</div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <button style={btnGhost} onClick={loadFromServer} title="從資料庫重新讀取最新資料（其他電腦的更新）">
              <RefreshCw size={15} />同步最新資料
            </button>
            <button
              onClick={undo}
              disabled={history.length === 0}
              title={history.length === 0 ? "沒有可復原的操作" : "復原上一步"}
              style={{ ...btnGhost, opacity: history.length === 0 ? 0.45 : 1, cursor: history.length === 0 ? "not-allowed" : "pointer" }}
            >
              <Undo2 size={15} />復原上一步
            </button>
            <div style={{ display: "flex", gap: 6, background: "#F2ECDE", padding: 4, borderRadius: 11, flexWrap: "wrap" }}>
              {tabList.map(([key, label, Icon]) => (
                <button key={key} onClick={() => setTab(key)} style={{ ...btnBase, background: tab === key ? "#B4694A" : "transparent", color: tab === key ? "#fff" : "#5C5648" }}><Icon size={15} />{label}</button>
              ))}
            </div>
            <button style={btnDanger} onClick={onLogout} title="登出">
              <LogOut size={15} />登出
            </button>
          </div>
        </div>

        {saveError && <div style={{ background: "#FDECEC", color: "#B4302A", padding: "8px 14px", borderRadius: 8, fontSize: 13, marginBottom: 12 }}>{saveError}</div>}

        {/* ---------------- 月曆排課 ---------------- */}
        {tab === "calendar" && (
          <div style={{ display: "flex", gap: 18, flexWrap: "wrap", alignItems: "flex-start" }}>
            <div style={{ flex: "2 1 560px", background: "#fff", borderRadius: 14, border: "1px solid #EDE6D6", padding: 16 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <button style={btnGhost} onClick={() => setMonth(new Date(year, mon - 1, 1))}><ChevronLeft size={16} /></button>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{year} 年 {mon + 1} 月</div>
                <button style={btnGhost} onClick={() => setMonth(new Date(year, mon + 1, 1))}><ChevronRight size={16} /></button>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
                <button style={btnGhost} onClick={() => window.print()}><Printer size={14} />列印本月課表（A4）</button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 6 }}>
                {WEEKDAYS.map((w) => (
                  <div key={w} style={{ boxSizing: "border-box", textAlign: "left", paddingLeft: 8, fontSize: 12, color: "#9A9284", fontWeight: 600, paddingBottom: 6 }}>{w}</div>
                ))}
                {cells.map((d, i) => {
                  if (!d) return <div key={i} />;
                  const ds = toDateStr(d);
                  const items = getDaySessions(ds);
                  const isSelected = ds === selectedDate;
                  const isToday = ds === todayStr();
                  const conflictDate = items.some((it) => findConflicts(it, items).length > 0);
                  return (
                    <div key={i} role="button" tabIndex={0} onClick={() => setSelectedDate(ds)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setSelectedDate(ds); }} style={{ boxSizing: "border-box", width: "100%", border: isSelected ? "2px solid #B4694A" : isToday ? "1px solid #B4694A" : "1px solid #EDE6D6", background: isSelected ? "#FBEFE7" : "#fff", borderRadius: 10, padding: "5px 4px", minHeight: 130, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "stretch", gap: 3, textAlign: "left" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 12, fontWeight: isToday ? 800 : 600 }}>{d.getDate()}</span>
                        {conflictDate && <AlertTriangle size={11} color="#B4302A" />}
                      </div>
                      {items.slice(0, 5).map((it) => {
                        const ci = courseInfo(it.courseType || COURSE_TYPES[0].key);
                        const names = it.attendees.map((a) => memberNameOnly(a)).join("、");
                        return (
                          <div key={it.id} style={{ fontSize: 9.5, lineHeight: 1.25, background: ci.bg, color: ci.color, borderRadius: 4, padding: "1px 4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 2 }}>
                            {it.virtual && <Repeat size={8} />}
                            {it.startTime} {it.courseType || ""}{names ? `｜${names}` : ""}
                          </div>
                        );
                      })}
                      {items.length > 5 && <div style={{ fontSize: 9, color: "#9A9284" }}>+{items.length - 5} 更多</div>}
                    </div>
                  );
                })}
              </div>
              <div style={{ display: "flex", gap: 16, marginTop: 12, fontSize: 12, color: "#8A8272", flexWrap: "wrap" }}>
                <span><Repeat size={11} style={{ verticalAlign: -1 }} /> 固定課程自動帶入</span>
                <span><AlertTriangle size={11} color="#B4302A" style={{ verticalAlign: -1 }} /> 當日有衝堂</span>
              </div>
            </div>

            <div style={{ flex: "1 1 360px", background: "#fff", borderRadius: 14, border: "1px solid #EDE6D6", padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{selectedDate} 排課明細</div>
                <button style={btnPrimary} onClick={() => setSlotTimeModal({ mode: "new" })}><Plus size={14} />新增時段</button>
              </div>
              {daySessions.length === 0 && <div style={{ fontSize: 13, color: "#9A9284" }}>本日尚無時段。</div>}
              {daySessions.map((session) => {
                const ci = courseInfo(session.courseType || COURSE_TYPES[0].key);
                const conflicts = findConflicts(session, daySessions);
                return (
                  <div key={session.id} style={{ border: `1px solid ${session.attendees.length ? ci.border : "#B7B7B7"}55`, borderStyle: session.attendees.length ? "solid" : "dashed", background: session.attendees.length ? ci.bg + "44" : "#F7F5EF", borderRadius: 10, padding: 10, marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                        <Clock size={12} />{session.startTime}｜{durationByKey(session.durationKey).label}
                        <span style={{ fontSize: 11, color: ci.color, fontWeight: 700 }}>{session.courseType || "不限"}</span>
                        <span style={{ fontSize: 10, color: "#8A8272", background: "#F2ECDE", padding: "1px 6px", borderRadius: 99 }}>{session.mode}</span>
                        {session.virtual && <span style={{ fontSize: 10, color: "#0F766E", display: "flex", alignItems: "center", gap: 2 }}><Repeat size={10} />固定課程</span>}
                      </div>
                      <div style={{ display: "flex", gap: 4 }}>
                        <button style={{ ...btnGhost, ...btnSm }} onClick={() => setSlotTimeModal({ mode: "edit", session })}><Edit3 size={11} /></button>
                        <button style={{ ...btnDanger, ...btnSm }} onClick={() => deleteSession(session)}><Trash2 size={11} /></button>
                      </div>
                    </div>
                    {conflicts.length > 0 && (
                      <div style={{ ...warnBox(true), marginTop: 8, marginBottom: 4 }}>
                        <AlertTriangle size={13} />衝堂：與 {conflicts.map((c) => c.startTime).join("、")} 重疊
                      </div>
                    )}
                    <div style={{ marginTop: 8 }}>
                      {session.attendees.length === 0 && <div style={{ fontSize: 12, color: "#B7B0A0", marginBottom: 6 }}>尚無上課者</div>}
                      {session.attendees.map((a) => (
                        <div key={a.id} style={{ background: "#fff", borderRadius: 8, padding: "6px 8px", marginBottom: 5, fontSize: 12 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6 }}>
                            <span>{memberLabel(a)}｜{a.courseType}｜{money(a.fee)}{a.paymentMode === "儲值" ? "（儲值）" : ""}</span>
                            <span style={{ display: "flex", gap: 8, alignItems: "center" }}>
                              <button onClick={() => setAttendeeEdit({ session, attendee: a })} style={{ border: "none", background: "transparent", cursor: "pointer", color: "#5C5648" }}><Edit3 size={12} /></button>
                              <button onClick={() => removeAttendee(session, a.id)} style={{ border: "none", background: "transparent", cursor: "pointer", color: "#B4302A" }}><X size={13} /></button>
                            </span>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6, marginTop: 4 }}>
                            <select
                              value={a.attendance || ""}
                              onChange={(e) => setAttendeeAttendance(session, a.id, e.target.value || null)}
                              style={{ fontSize: 11, padding: "3px 6px", borderRadius: 6, border: "1px solid #DED5BF", color: attendanceColor(a.attendance), fontWeight: 700, background: "#FBF8F1" }}
                            >
                              <option value="">尚未記錄</option>
                              {ATTENDANCE_OPTIONS.map((op) => <option key={op} value={op}>{op}</option>)}
                            </select>
                            {a.paymentMode === "單次" ? (
                              <button onClick={() => setPaymentEdit({ session, attendee: a })} style={{ border: "none", background: "transparent", cursor: "pointer", fontWeight: 700, color: a.paid ? "#2F7A3B" : "#B4302A", fontSize: 11 }}>
                                {a.paid ? "已繳費" : "未繳費"}
                              </button>
                            ) : (
                              <span style={{ color: a.deducted ? "#0F766E" : "#9A9284", fontWeight: 700, fontSize: 11 }}>
                                {a.deducted ? "已扣儲值堂數" : "出席後才扣堂"}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                      <button style={{ ...btnGhost, ...btnSm, marginTop: 4 }} onClick={() => setAttendeeModalSessionId(session.id)}><UserPlus size={12} />新增上課者</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ---------------- 固定課程 ---------------- */}
        {tab === "recurring" && (
          <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #EDE6D6", padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>固定課程樣板（{templates.length}）</div>
              <button style={btnPrimary} onClick={() => setTemplateModal("new")}><Plus size={14} />新增固定課程</button>
            </div>
            <div style={{ fontSize: 12, color: "#8A8272", marginBottom: 14 }}>月曆會自動依頻率帶入固定課程；若需調整或取消單次，至月曆該日編輯即可，不影響其餘週次。</div>
            {templates.length === 0 && <div style={{ fontSize: 13, color: "#9A9284" }}>尚未設定固定課程。</div>}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {templates.map((t) => {
                const ci = courseInfo(t.courseType);
                return (
                  <div key={t.id} style={{ border: `1px solid ${ci.border}55`, background: ci.bg + "33", borderRadius: 12, padding: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{t.name || t.courseType}</div>
                        <div style={{ fontSize: 12, color: "#5C5648", marginTop: 3 }}>
                          {WEEKDAY_FULL[t.dayOfWeek]}｜{WEEK_PATTERNS.find((w) => w.key === t.weekPattern)?.label}｜{t.startTime}｜{durationByKey(t.durationKey).label}｜{t.mode}
                        </div>
                        <div style={{ fontSize: 12, color: "#8A8272", marginTop: 3 }}>
                          期間：{t.startDate || "—"} ～ {t.endDate || "持續進行"}
                          {t.endDate && t.endDate < todayStr() && <span style={{ color: "#B4302A", fontWeight: 700 }}>（已結束）</span>}
                        </div>
                        <div style={{ fontSize: 12, color: "#8A8272", marginTop: 3 }}>學員：{t.attendees.map((a) => memberNameOnly(a)).join("、") || "尚未設定"}</div>
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button style={btnGhost} onClick={() => setTemplateModal(t)}><Edit3 size={13} />編輯</button>
                        <button style={btnDanger} onClick={() => deleteTemplate(t.id)}><Trash2 size={13} /></button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ---------------- 家庭與學生 ---------------- */}
        {tab === "families" && (
          <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #EDE6D6", padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>家庭列表（{families.length}）</div>
              <button style={btnPrimary} onClick={() => setFamilyModal("new")}><Plus size={14} />新增家庭</button>
            </div>
            {families.length === 0 && <div style={{ fontSize: 13, color: "#9A9284" }}>尚未新增家庭。</div>}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {families.map((f) => (
                <div key={f.id} style={{ border: "1px solid #EDE6D6", borderRadius: 12, padding: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{f.familyName}</div>
                      {f.note && <div style={{ fontSize: 12, color: "#9A9284" }}>{f.note}</div>}
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button style={btnGhost} onClick={() => setFamilyModal(f)}><Edit3 size={13} />編輯</button>
                      <button style={btnDanger} onClick={() => deleteFamily(f.id)}><Trash2 size={13} /></button>
                    </div>
                  </div>
                  {(f.storedAccounts || []).length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
                      {f.storedAccounts.map((a) => (
                        <span key={a.id} style={{ fontSize: 11, background: "#EDE9DA", color: "#6D5B3E", padding: "3px 9px", borderRadius: 99, fontWeight: 600 }}>
                          <Wallet size={10} style={{ verticalAlign: -1 }} /> 單堂{money(a.pricePerUnit)}｜剩 {a.remainingUnits ?? 0} 堂
                        </span>
                      ))}
                    </div>
                  )}
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
                    {f.members.map((m) => (
                      <div key={m.id} style={{ background: "#FBF8F1", borderRadius: 9, padding: "8px 10px" }}>
                        <div style={{ fontSize: 13, fontWeight: 700 }}>{m.name} <span style={{ fontWeight: 500, color: "#9A9284", fontSize: 12 }}>（{m.relation}）</span></div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
                          {m.plans.map((p) => { const ci = courseInfo(p.courseType); return <span key={p.id} style={{ fontSize: 11, background: ci.bg, color: ci.color, padding: "3px 9px", borderRadius: 99, fontWeight: 600 }}>{p.courseType}</span>; })}
                          {m.plans.length === 0 && <span style={{ fontSize: 11, color: "#B7B0A0" }}>尚未設定課程</span>}
                        </div>
                      </div>
                    ))}
                    {f.members.length === 0 && <div style={{ fontSize: 12, color: "#B7B0A0" }}>尚無成員</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ---------------- 收費總覽 ---------------- */}
        {tab === "billing" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #EDE6D6", padding: 16, overflowX: "auto" }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>累計上課堂數（依成員與課程類型自動統計）</div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, marginTop: 10 }}>
                <thead><tr style={{ textAlign: "left", color: "#9A9284", borderBottom: "1px solid #EDE6D6" }}>
                  <th style={{ padding: "8px 6px" }}>家庭</th><th style={{ padding: "8px 6px" }}>成員</th><th style={{ padding: "8px 6px" }}>課程類型</th>
                  <th style={{ padding: "8px 6px" }}>累計堂數</th><th style={{ padding: "8px 6px" }}>累計費用</th>
                </tr></thead>
                <tbody>
                  {attendanceStats.map((r, idx) => { const ci = courseInfo(r.courseType); const fam = families.find((f) => f.id === r.familyId); const m = fam?.members.find((mm) => mm.id === r.memberId);
                    return (<tr key={idx} style={{ borderBottom: "1px solid #F2ECDE" }}>
                      <td style={{ padding: "8px 6px" }}>{fam?.familyName || "—"}</td>
                      <td style={{ padding: "8px 6px", fontWeight: 600 }}>{m?.name || "（已刪除）"}</td>
                      <td style={{ padding: "8px 6px" }}><span style={{ background: ci.bg, color: ci.color, padding: "3px 9px", borderRadius: 99, fontWeight: 600 }}>{r.courseType}</span></td>
                      <td style={{ padding: "8px 6px" }}>{r.unitSum} 堂（{r.sessionCount} 次）</td>
                      <td style={{ padding: "8px 6px" }}>{money(r.feeSum)}</td>
                    </tr>);
                  })}
                  {attendanceStats.length === 0 && <tr><td colSpan={5} style={{ padding: "12px 6px", color: "#9A9284" }}>尚無上課紀錄</td></tr>}
                </tbody>
              </table>
            </div>

            <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #EDE6D6", padding: 16, overflowX: "auto" }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 10 }}>單次繳費紀錄</div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead><tr style={{ textAlign: "left", color: "#9A9284", borderBottom: "1px solid #EDE6D6" }}>
                  <th style={{ padding: "8px 6px" }}>上課日期</th><th style={{ padding: "8px 6px" }}>成員</th><th style={{ padding: "8px 6px" }}>課程</th>
                  <th style={{ padding: "8px 6px" }}>出席狀況</th>
                  <th style={{ padding: "8px 6px" }}>費用</th><th style={{ padding: "8px 6px" }}>繳費狀況</th><th style={{ padding: "8px 6px" }}>付款方式</th>
                  <th style={{ padding: "8px 6px" }}>發票</th><th style={{ padding: "8px 6px" }}>操作</th>
                </tr></thead>
                <tbody>
                  {perSessionRows.map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: "1px solid #F2ECDE" }}>
                      <td style={{ padding: "8px 6px" }}>{row.date} {row.startTime}</td>
                      <td style={{ padding: "8px 6px" }}>{memberLabel(row.attendee)}</td>
                      <td style={{ padding: "8px 6px" }}>{row.courseType}</td>
                      <td style={{ padding: "8px 6px", fontWeight: 700, color: attendanceColor(row.attendee.attendance) }}>{row.attendee.attendance || "尚未記錄"}</td>
                      <td style={{ padding: "8px 6px" }}>{money(row.attendee.fee)}</td>
                      <td style={{ padding: "8px 6px", fontWeight: 700, color: row.attendee.paid ? "#2F7A3B" : "#B4302A" }}>{row.attendee.paid ? `已繳（${row.attendee.paidDate || ""}）` : "未繳"}</td>
                      <td style={{ padding: "8px 6px" }}>{row.attendee.paid ? `${row.attendee.method}${row.attendee.method === "匯款" && row.attendee.last5 ? `（末五碼 ${row.attendee.last5}）` : ""}` : "—"}</td>
                      <td style={{ padding: "8px 6px" }}>{row.attendee.invoiced ? "已開立" : "未開立"}</td>
                      <td style={{ padding: "8px 6px" }}>
                        <button style={{ ...btnGhost, ...btnSm }} onClick={() => setPaymentEdit({ session: slots.find((s) => s.id === row.sessionId), attendee: row.attendee })}>編輯繳費</button>
                      </td>
                    </tr>
                  ))}
                  {perSessionRows.length === 0 && <tr><td colSpan={9} style={{ padding: "12px 6px", color: "#9A9284" }}>尚無單次繳費紀錄</td></tr>}
                </tbody>
              </table>
            </div>

            <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #EDE6D6", padding: 16, overflowX: "auto" }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 10 }}>家庭儲值帳戶總覽</div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead><tr style={{ textAlign: "left", color: "#9A9284", borderBottom: "1px solid #EDE6D6" }}>
                  <th style={{ padding: "8px 6px" }}>家庭</th><th style={{ padding: "8px 6px" }}>單堂價格</th><th style={{ padding: "8px 6px" }}>剩餘堂數</th><th style={{ padding: "8px 6px" }}>最近儲值</th>
                </tr></thead>
                <tbody>
                  {families.flatMap((f) => (f.storedAccounts || []).map((a) => ({ f, a }))).map(({ f, a }, idx) => {
                    const last = (a.topUps || [])[a.topUps.length - 1];
                    return (
                      <tr key={idx} style={{ borderBottom: "1px solid #F2ECDE" }}>
                        <td style={{ padding: "8px 6px", fontWeight: 600 }}>{f.familyName}</td>
                        <td style={{ padding: "8px 6px" }}>{money(a.pricePerUnit)}</td>
                        <td style={{ padding: "8px 6px", fontWeight: 700, color: (a.remainingUnits ?? 0) <= 0 ? "#B4302A" : "#2F7A3B" }}>{a.remainingUnits ?? 0} 堂</td>
                        <td style={{ padding: "8px 6px" }}>{last ? `${last.date}｜${money(last.amount)}｜${last.method}${last.invoiced ? "（已開發票）" : ""}` : "—"}</td>
                      </tr>
                    );
                  })}
                  {families.every((f) => (f.storedAccounts || []).length === 0) && <tr><td colSpan={4} style={{ padding: "12px 6px", color: "#9A9284" }}>尚無儲值帳戶</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {familyModal && (
        <Modal title={familyModal === "new" ? "新增家庭" : "編輯家庭"} onClose={() => setFamilyModal(null)} width={580}>
          <FamilyForm initial={familyModal === "new" ? null : familyModal} onSave={saveFamily} onCancel={() => setFamilyModal(null)} />
        </Modal>
      )}

      {slotTimeModal && (
        <Modal title={slotTimeModal.mode === "new" ? "新增時段" : "編輯時段"} onClose={() => setSlotTimeModal(null)}>
          <SlotTimeForm
            date={selectedDate}
            initial={slotTimeModal.session}
            conflictCandidates={daySessions}
            onSave={(fields) => (slotTimeModal.mode === "new" ? createManualSession(fields) : updateSessionTime(slotTimeModal.session, fields))}
            onCancel={() => setSlotTimeModal(null)}
          />
        </Modal>
      )}

      {attendeeModalSessionId && (
        <Modal title="新增上課者" onClose={() => setAttendeeModalSessionId(null)}>
          <AddAttendeeForm session={daySessions.find((s) => s.id === attendeeModalSessionId)} families={families} onAdd={(att) => addAttendee(daySessions.find((s) => s.id === attendeeModalSessionId), att)} onCancel={() => setAttendeeModalSessionId(null)} />
        </Modal>
      )}

      {paymentEdit && (
        <Modal title="編輯繳費資訊" onClose={() => setPaymentEdit(null)}>
          <PaymentDetailForm attendee={paymentEdit.attendee} onCancel={() => setPaymentEdit(null)} onSave={(patch) => { updateAttendeePayment(paymentEdit.session, paymentEdit.attendee.id, patch); setPaymentEdit(null); }} />
        </Modal>
      )}

      {attendeeEdit && (
        <Modal title="編輯上課者內容" onClose={() => setAttendeeEdit(null)}>
          <EditAttendeeForm
            session={attendeeEdit.session}
            attendee={attendeeEdit.attendee}
            family={families.find((f) => f.id === attendeeEdit.attendee.familyId)}
            onCancel={() => setAttendeeEdit(null)}
            onSave={(patch) => updateAttendeeDetails(attendeeEdit.session, attendeeEdit.attendee.id, patch)}
          />
        </Modal>
      )}

      {templateModal && (
        <Modal title={templateModal === "new" ? "新增固定課程" : "編輯固定課程"} onClose={() => setTemplateModal(null)} width={580}>
          <RecurringTemplateForm initial={templateModal === "new" ? null : templateModal} families={families} onSave={saveTemplate} onCancel={() => setTemplateModal(null)} />
        </Modal>
      )}
      </div>

      <div className="print-calendar" style={{ fontFamily: "'Noto Sans TC', system-ui, sans-serif", color: "#1a1a1a", width: "100%", boxSizing: "border-box" }}>
        <h2 style={{ textAlign: "center", margin: "0 0 8px", fontSize: 22 }}>{year} 年 {mon + 1} 月課表</h2>
        <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
          <colgroup>
            <col style={{ width: "4%" }} />
            {Array.from({ length: 6 }).map((_, i) => <col key={i} style={{ width: "16%" }} />)}
          </colgroup>
          <thead>
            <tr>
              {WEEKDAYS.map((w) => (
                <th key={w} style={{ border: "1px solid #999", padding: "5px 3px", fontSize: 13, background: "#eee" }}>{w}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(() => {
              const printRows = Math.ceil(cells.length / 7);
              const printRowHeight = Math.max(95, Math.min(160, Math.floor(650 / printRows)));
              return Array.from({ length: printRows }).map((_, rowIdx) => (
                <tr key={rowIdx}>
                  {cells.slice(rowIdx * 7, rowIdx * 7 + 7).map((d, colIdx) => {
                    if (!d) return <td key={colIdx} style={{ border: "1px solid #ccc", height: printRowHeight, verticalAlign: "top" }} />;
                    const ds = toDateStr(d);
                    const items = getDaySessions(ds);
                    return (
                      <td key={colIdx} style={{ border: "1px solid #ccc", height: printRowHeight, verticalAlign: "top", padding: 4, fontSize: 10.5, overflow: "hidden" }}>
                        <div style={{ fontWeight: 700, fontSize: 12.5, marginBottom: 3 }}>{d.getDate()}</div>
                        {items.map((it) => (
                          <div key={it.id} style={{ display: "flex", gap: 4, marginBottom: 3 }}>
                            <div style={{ fontWeight: 700, lineHeight: 1.3, flexShrink: 0, width: 34 }}>{it.startTime}</div>
                            <div style={{ lineHeight: 1.3, overflow: "hidden", flex: 1 }}>
                              {it.attendees.map((a) => memberNameOnly(a)).join("、")}
                            </div>
                          </div>
                        ))}
                      </td>
                    );
                  })}
                </tr>
              ));
            })()}
          </tbody>
        </table>
      </div>
    </>
  );
}
