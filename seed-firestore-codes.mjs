// seed-firestore-codes.mjs
// One-time (and safely repeatable) script to load access codes into Firestore.
//
// Setup:
//   1. npm install firebase-admin
//   2. Firebase Console -> Project Settings -> Service Accounts -> Generate new private key
//      Save that file as serviceAccountKey.json in this same folder.
//   3. node seed-firestore-codes.mjs
//
// Safe to re-run: it reads which codes already exist first and only creates the
// ones that are missing, so an already-activated code is never touched or reset.

import { readFileSync } from "node:fs";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

const serviceAccount = JSON.parse(readFileSync("./serviceAccountKey.json", "utf8"));

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

// 150 one-account-per-code access codes.
const CODES = [
  "222S-AAPC-EW9N",
  "24SB-Z76T-JM9Y",
  "2552-SQY7-87CR",
  "2GD5-AZE4-BAW6",
  "2KJN-RWDX-3VCT",
  "2MAT-GARH-MF5Q",
  "2QSD-8MDV-BZPE",
  "2T4W-GD2D-R7RA",
  "2UKF-KDMJ-BNPM",
  "2VC3-DQQA-J7T2",
  "2YGU-6SD9-FW3J",
  "3P9S-3559-R6SK",
  "3SDN-S6CA-GD6Y",
  "3W62-XCKV-BE2C",
  "4C6C-9VT4-K9M3",
  "4KY3-A4JB-5ZJ6",
  "4PEM-AFCR-KDSB",
  "54ER-EQFA-H5SD",
  "594P-AFHB-43DQ",
  "5ZPX-5Q89-6DWY",
  "62H2-NJKD-ECRB",
  "6DF4-GKGM-QS6X",
  "732W-D4MV-FAAE",
  "75X2-J3N5-CKP8",
  "7BFZ-33UP-MQV6",
  "7QNP-4DNU-CNFM",
  "7WZP-BSA4-3U99",
  "82FP-DVFD-4TNQ",
  "83BG-P4SS-HHXH",
  "84PR-JX53-M2SG",
  "85SP-5ACY-XGWS",
  "8A89-F5CP-9JG6",
  "8CKM-9XBB-PTY9",
  "992N-BAGG-S7JD",
  "9SZC-PTV6-YYUH",
  "9WFP-FD9X-SU7P",
  "9YJE-USFR-AZKB",
  "A6WA-4ADN-9BU3",
  "A766-8MN6-QHYT",
  "AASA-H8R2-RGFH",
  "ABMK-73D4-853H",
  "AGKW-M5PF-K6KC",
  "ANC5-9UJG-CTTJ",
  "APBR-TT4K-3V2X",
  "APKM-N2WN-U5BV",
  "ASA9-VV3N-5QVV",
  "AT5P-6FRU-GMPJ",
  "B6R8-2DEJ-8774",
  "B9UA-SAKZ-7J8X",
  "BAC8-52FH-FG2Z",
  "BCNE-B7RA-4ZZ7",
  "BD9U-AV2F-SXZM",
  "BP3S-YWB6-W9XT",
  "C5QZ-Y2SC-UWHT",
  "C6BH-M3UB-PJRJ",
  "CBC5-NTZJ-K8ET",
  "CGSZ-G5XT-TRSA",
  "CK49-TUU3-RFA2",
  "CQD6-BAVH-9AAU",
  "DAWP-GVTB-R2EX",
  "DE2C-9UMJ-XYN5",
  "DH7F-6VT7-KJ84",
  "E977-CF7C-MMSE",
  "EACD-HU6P-H5WT",
  "EAR4-VKUP-9YHD",
  "EQ2X-R7CR-JH5U",
  "EREJ-WN58-RX4M",
  "ERV3-PRJF-CJFA",
  "EXS6-PD6M-5XGV",
  "EYDV-EM92-GHUT",
  "F5CN-V9AB-ZTHB",
  "F9SZ-HJM8-4PWK",
  "FB2K-7ATS-WZ7H",
  "FDF7-NKPK-PF7E",
  "FMYJ-2M59-T7QE",
  "FRGV-ZFW6-CJGG",
  "FXA8-Q68P-K6MK",
  "FY9R-7G84-W3H6",
  "GNGS-RH7H-FGAU",
  "GVXQ-MN9B-TV7E",
  "HH3C-UAPG-54QN",
  "HQWF-7G3R-GYND",
  "JF9C-B9AB-898Q",
  "JFBS-NC3F-W8P9",
  "JP2G-HXCJ-M4QC",
  "JRDS-AQSZ-7AD2",
  "K2PS-6PCP-C5KR",
  "K87C-T8T8-MQQ6",
  "KG6M-5FM8-2YBD",
  "KGND-E788-CUKA",
  "KTC9-K9FE-55HT",
  "M499-4R7Y-AVWP",
  "M64F-J8R3-3ZH2",
  "M7YX-6WN9-BQXM",
  "MAZK-S9D2-S2BG",
  "MRMY-HBBV-P6PX",
  "MUK3-FAV5-86VA",
  "PP6D-QYTH-EVDQ",
  "PWNU-8THU-X46C",
  "Q2H5-CMCU-WUKC",
  "Q5AS-XPEN-NBUX",
  "QWWU-FV3F-QJKH",
  "R2Q5-4Q6P-WKU9",
  "RR73-SFQW-RTBN",
  "S8FR-8ZVP-8WA5",
  "SM3T-5MZS-V9MF",
  "SS7X-6BGT-S6HW",
  "SSKX-RXXG-ZFPP",
  "SWM7-V26E-RQUS",
  "T53P-7CM9-7S9X",
  "T58E-GAW9-4AKF",
  "T8FZ-S8EB-4CCH",
  "TAPD-Y3J7-D57Q",
  "TCGS-Q2T3-3MWZ",
  "TH5V-4M2W-BY6U",
  "TH6P-3DNN-F4TY",
  "THBW-7EMY-7RXZ",
  "TNGW-ATUN-CZX9",
  "TTKC-33AS-UC2B",
  "U7XH-YSZ5-EYWN",
  "UBEQ-UTSZ-3QJG",
  "UJ5H-7VF5-5XGZ",
  "UK3N-8F5D-MEJ9",
  "URZS-VJEU-QXEF",
  "V3UA-SZPQ-8CZ4",
  "VGB4-286S-ZVMQ",
  "VTXE-74PF-R739",
  "W2NV-QQG9-JA2G",
  "W5KT-ZRGY-3FZ5",
  "W7CX-WF3V-9JT7",
  "WAFG-MXGG-SYPJ",
  "WAVS-NY6W-HDTZ",
  "WKN4-78HX-GVVJ",
  "WMJQ-752K-JEFX",
  "WNKM-W54T-XZFR",
  "X3EP-6U3E-72XA",
  "XDSS-5G6K-HVSZ",
  "XPDR-4R5X-NW72",
  "XWVX-5PJ2-HFAU",
  "XXMD-YT7S-UJSD",
  "XZU4-QA2U-NPX2",
  "YCPF-AEZH-8D3Y",
  "YT3E-4VAU-VU65",
  "YTHY-6ZUJ-CDK6",
  "ZEKG-QSJH-AWQP",
  "ZM3D-NRWW-WKJ8",
  "ZPZ8-38XZ-87RC",
  "ZXMF-MT4Z-QTH4",
  "ZZCM-DRFS-BW63",
  "ZZSK-JHE7-2HC3"
];

const MASTER_CODE = "DRXW-7SHQ-9K2M-Z6PT";

function blankCodeDoc(isMaster) {
  return {
    isMaster,
    used: false,
    boundUID: null,
    email: null,      // set from the verified Google account email on first redemption
    deviceId: null,   // set on every redemption — groundwork for future sharing checks
    lastLogin: null,  // updated on every successful redemption, not just the first
    activatedAt: null,
    createdAt: FieldValue.serverTimestamp(),
  };
}

async function seed() {
  // Read what's already there so re-running this never overwrites an activated code.
  const existingSnap = await db.collection("accessCodes").get();
  const existingIds = new Set(existingSnap.docs.map((d) => d.id));

  let batch = db.batch();
  let writes = 0;
  let skipped = 0;

  for (const code of CODES) {
    if (existingIds.has(code)) {
      skipped++;
      continue; // already exists — leave it exactly as it is
    }
    batch.set(db.collection("accessCodes").doc(code), blankCodeDoc(false));
    writes++;
    if (writes % 400 === 0) {
      await batch.commit();
      batch = db.batch();
    }
  }

  if (!existingIds.has(MASTER_CODE)) {
    batch.set(db.collection("accessCodes").doc(MASTER_CODE), blankCodeDoc(true));
    writes++;
  } else {
    skipped++;
  }

  await batch.commit();
  console.log(`Created ${writes} new document(s). Skipped ${skipped} that already existed.`);
}

seed().catch(console.error);
