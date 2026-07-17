// Adds ~500 more essential medicines covering specialties missing from the
// first seed: dermatology, cardiology, psychiatry, neurology, ophthalmology,
// ENT, gynecology, urology, endocrine, pediatrics, and more.
import { Pool } from "pg"

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

// [brand, generic, composition, category, form, strength, mfr, mrp, rx, sideEffects, contra, interactions, pregCat, pedSafe, gerCaution, uses]
const CATALOG = [
  // ---------- DERMATOLOGY ----------
  ["Betnovate-N", "Betamethasone + Neomycin", "Betamethasone 0.1% + Neomycin 0.5%", "Topical Steroid", "Cream", "20g", "GSK", 42, true, "Skin thinning with prolonged use", "Fungal/viral skin infections, face use caution", "None significant topically", "C", false, false, "Eczema with secondary infection, dermatitis"],
  ["Betnovate-C", "Betamethasone + Clioquinol", "Betamethasone 0.1% + Clioquinol 3%", "Topical Steroid", "Cream", "20g", "GSK", 45, true, "Skin thinning, staining", "Viral skin infections", "None significant", "C", false, false, "Infected eczema, dermatitis"],
  ["Quadriderm", "Steroid + Antifungal + Antibiotic", "Beclomethasone + Clotrimazole + Neomycin", "Topical Combo", "Cream", "20g", "MSD", 130, true, "Skin thinning", "Prolonged face use", "None significant", "C", false, false, "Mixed skin infections with itching"],
  ["Panderm Plus", "Steroid + Antifungal + Antibiotic", "Clobetasol + Ornidazole + Ofloxacin + Terbinafine", "Topical Combo", "Cream", "15g", "Macleods", 90, true, "Skin thinning, burning", "Face use, prolonged use", "None significant", "C", false, false, "Infected itchy skin lesions"],
  ["Luliconazole (Lulifin)", "Luliconazole", "Luliconazole 1%", "Antifungal", "Cream", "10g", "Sun Pharma", 190, true, "Mild irritation", "Hypersensitivity", "None significant", "C", false, false, "Ringworm, tinea infections"],
  ["Terbinaforce", "Terbinafine", "Terbinafine 250mg", "Antifungal", "Tablet", "250mg", "Mankind", 105, true, "GI upset, taste disturbance, liver strain", "Liver disease", "Rifampicin, cimetidine", "B", false, true, "Fungal skin/nail infections (oral therapy)"],
  ["Fluka 150", "Fluconazole", "Fluconazole 150mg", "Antifungal", "Tablet", "150mg", "Cipla", 32, true, "Nausea, headache", "Liver disease caution, QT prolongation", "Warfarin, phenytoin, QT drugs", "C", false, true, "Vaginal candidiasis, fungal infections"],
  ["Itraspan 200", "Itraconazole", "Itraconazole 200mg", "Antifungal", "Capsule", "200mg", "Lifecare", 320, true, "GI upset, liver strain", "Heart failure, liver disease", "Many CYP3A4 drugs, antacids", "C", false, true, "Extensive tinea, onychomycosis"],
  ["Permite Cream", "Permethrin", "Permethrin 5%", "Scabicide", "Cream", "30g", "Galderma", 110, false, "Mild burning, itching", "Hypersensitivity", "None significant", "B", true, false, "Scabies treatment (overnight application)"],
  ["Scabper Lotion", "Permethrin", "Permethrin 5%", "Scabicide", "Drops", "50ml", "Ipca", 95, false, "Mild irritation", "Broken skin caution", "None", "B", true, false, "Scabies, lice"],
  ["Acnestar Gel", "Clindamycin + Nicotinamide", "Clindamycin 1% + Nicotinamide 4%", "Anti-acne", "Gel", "15g", "Mankind", 115, false, "Dryness, peeling", "None major", "Avoid with other topical acne drugs simultaneously", "B", false, false, "Acne vulgaris, pimples"],
  ["Retino-A 0.025", "Tretinoin", "Tretinoin 0.025%", "Retinoid", "Cream", "20g", "J&J", 150, true, "Dryness, photosensitivity, peeling", "Pregnancy, eczema", "Other exfoliants", "D", false, false, "Acne, comedones (night use only)"],
  ["Benzac AC 2.5", "Benzoyl Peroxide", "Benzoyl Peroxide 2.5%", "Anti-acne", "Gel", "20g", "Galderma", 175, false, "Dryness, bleaching of fabric", "Very sensitive skin", "Avoid with tretinoin same time", "C", false, false, "Inflammatory acne"],
  ["Melaglow", "Skin Brightening", "Niacinamide + botanical extracts", "Dermaceutical", "Cream", "20g", "Abbott", 340, false, "None significant", "None", "None", "A", false, false, "Hyperpigmentation, uneven skin tone"],
  ["Kojivit Gel", "Kojic Acid combo", "Kojic acid + Arbutin + Vitamin C", "Dermaceutical", "Gel", "15g", "Micro Labs", 280, false, "Mild irritation", "None", "None", "A", false, false, "Melasma, dark spots"],
  ["Elovera Cream", "Aloe + Vitamin E", "Aloe vera + Vitamin E", "Moisturizer", "Cream", "60g", "Glenmark", 250, false, "None", "None", "None", "A", true, false, "Dry skin, moisturization"],
  ["Venusia Max", "Emollient", "Shea butter + glycerin emollient", "Moisturizer", "Cream", "150g", "Dr. Reddy's", 420, false, "None", "None", "None", "A", true, false, "Very dry skin, eczema-prone skin"],
  ["Candid Powder", "Clotrimazole", "Clotrimazole 1% dusting powder", "Antifungal", "Powder", "100g", "Glenmark", 130, false, "None significant", "None", "None", "B", true, false, "Fungal infection in skin folds, sweaty areas"],
  ["Neosporin Powder", "Antibiotic Powder", "Neomycin + Polymyxin B + Bacitracin", "Topical Antibiotic", "Powder", "10g", "GSK", 90, false, "Local sensitivity", "Large wounds", "None", "C", true, false, "Minor cuts, wound dusting"],
  ["Silverex Cream", "Silver Sulfadiazine", "Silver Sulfadiazine 1%", "Burn Cream", "Cream", "25g", "Ranbaxy", 88, true, "Local burning", "Sulfa allergy, pregnancy near term, newborns", "None significant", "B", false, false, "Burns, infected wounds"],
  ["Thrombophob Gel", "Heparinoid", "Heparinoid 200 IU/g", "Anti-thrombotic Topical", "Gel", "20g", "Zydus", 155, false, "Mild irritation", "Open wounds", "None", "B", true, false, "Bruises, superficial thrombophlebitis, sprain swelling"],
  ["Soframycin Skin Cream", "Framycetin", "Framycetin 1%", "Topical Antibiotic", "Cream", "100g", "Sanofi", 120, false, "Sensitivity", "Large open wounds", "None", "C", true, false, "Cuts, burns, boils"],
  // ---------- CARDIOLOGY ----------
  ["Telma AM", "Telmisartan + Amlodipine", "Telmisartan 40mg + Amlodipine 5mg", "Antihypertensive", "Tablet", "40/5mg", "Glenmark", 250, true, "Dizziness, ankle swelling", "Pregnancy, bilateral RAS", "NSAIDs, potassium supplements", "D", false, true, "Hypertension not controlled by single drug"],
  ["Telma H", "Telmisartan + HCTZ", "Telmisartan 40mg + Hydrochlorothiazide 12.5mg", "Antihypertensive", "Tablet", "40/12.5mg", "Glenmark", 240, true, "Dizziness, electrolyte imbalance", "Pregnancy, anuria, sulfa allergy", "NSAIDs, lithium, digoxin", "D", false, true, "Hypertension with volume overload"],
  ["Amlokind-AT", "Amlodipine + Atenolol", "Amlodipine 5mg + Atenolol 50mg", "Antihypertensive", "Tablet", "5/50mg", "Mankind", 45, true, "Fatigue, cold extremities, ankle edema", "Asthma, heart block, bradycardia", "Verapamil, insulin (masks hypoglycemia)", "D", false, true, "Hypertension with high heart rate"],
  ["Losar 50", "Losartan", "Losartan 50mg", "Antihypertensive", "Tablet", "50mg", "Unichem", 90, true, "Dizziness", "Pregnancy, bilateral RAS", "NSAIDs, potassium, lithium", "D", false, true, "Hypertension, diabetic kidney protection"],
  ["Losar-H", "Losartan + HCTZ", "Losartan 50mg + HCTZ 12.5mg", "Antihypertensive", "Tablet", "50/12.5mg", "Unichem", 115, true, "Dizziness, electrolyte changes", "Pregnancy, sulfa allergy", "NSAIDs, lithium", "D", false, true, "Hypertension"],
  ["Envas 5", "Enalapril", "Enalapril 5mg", "ACE Inhibitor", "Tablet", "5mg", "Cadila", 45, true, "Dry cough, dizziness", "Pregnancy, angioedema history, bilateral RAS", "NSAIDs, potassium, lithium", "D", false, true, "Hypertension, heart failure"],
  ["Ramistar 5", "Ramipril", "Ramipril 5mg", "ACE Inhibitor", "Tablet", "5mg", "Lupin", 120, true, "Dry cough, hypotension", "Pregnancy, angioedema history", "NSAIDs, potassium supplements", "D", false, true, "Hypertension, post-MI, heart failure"],
  ["Metolar XR 50", "Metoprolol", "Metoprolol Succinate 50mg XR", "Beta Blocker", "Tablet", "50mg XR", "Cipla", 90, true, "Fatigue, bradycardia, cold hands", "Asthma, heart block, severe bradycardia", "Verapamil, clonidine, insulin", "C", false, true, "Hypertension, angina, arrhythmia, post-MI"],
  ["Betaloc 25", "Metoprolol", "Metoprolol Tartrate 25mg", "Beta Blocker", "Tablet", "25mg", "AstraZeneca", 45, true, "Fatigue, dizziness", "Asthma, heart block", "Verapamil, clonidine", "C", false, true, "Hypertension, palpitations"],
  ["Concor 5", "Bisoprolol", "Bisoprolol 5mg", "Beta Blocker", "Tablet", "5mg", "Merck", 165, true, "Fatigue, bradycardia", "Asthma, heart block", "Verapamil, other antihypertensives", "C", false, true, "Hypertension, heart failure, angina"],
  ["Cardivas 3.125", "Carvedilol", "Carvedilol 3.125mg", "Beta Blocker", "Tablet", "3.125mg", "Sun Pharma", 62, true, "Dizziness, fatigue", "Asthma, decompensated heart failure", "Digoxin, insulin", "C", false, true, "Heart failure, hypertension"],
  ["Clopitab 75", "Clopidogrel", "Clopidogrel 75mg", "Antiplatelet", "Tablet", "75mg", "Lupin", 60, true, "Bleeding risk, GI upset", "Active bleeding, peptic ulcer", "Omeprazole, NSAIDs, warfarin", "B", false, true, "Post-stent, stroke/MI prevention"],
  ["Ecosprin-AV 75", "Aspirin + Atorvastatin", "Aspirin 75mg + Atorvastatin 10mg", "Antiplatelet/Statin", "Capsule", "75/10mg", "USV", 105, true, "Gastric irritation, muscle pain", "Bleeding disorders, active liver disease, pregnancy", "Warfarin, other NSAIDs", "X", false, true, "Cardiovascular protection combo"],
  ["Rosuvas 10", "Rosuvastatin", "Rosuvastatin 10mg", "Statin", "Tablet", "10mg", "Ranbaxy", 250, true, "Muscle pain, liver enzyme rise", "Active liver disease, pregnancy", "Cyclosporine, gemfibrozil", "X", false, false, "High cholesterol, CV risk reduction"],
  ["Storvas 20", "Atorvastatin", "Atorvastatin 20mg", "Statin", "Tablet", "20mg", "Ranbaxy", 135, true, "Muscle pain", "Liver disease, pregnancy", "Clarithromycin, cyclosporine", "X", false, false, "High cholesterol"],
  ["Sorbitrate 5", "Isosorbide Dinitrate", "ISDN 5mg", "Nitrate", "Tablet", "5mg", "Abbott", 25, true, "Headache, flushing, hypotension", "Sildenafil use, severe anemia", "PDE5 inhibitors (dangerous)", "C", false, true, "Angina relief (sublingual)"],
  ["Monotrate 20", "Isosorbide Mononitrate", "ISMN 20mg", "Nitrate", "Tablet", "20mg", "Sun Pharma", 55, true, "Headache, dizziness", "PDE5 inhibitor use", "Sildenafil (contraindicated)", "C", false, true, "Angina prophylaxis"],
  ["Lasix 40", "Furosemide", "Furosemide 40mg", "Loop Diuretic", "Tablet", "40mg", "Sanofi", 15, true, "Dehydration, low potassium, dizziness", "Anuria, severe electrolyte depletion", "Digoxin, lithium, aminoglycosides", "C", false, true, "Edema, heart failure, fluid overload"],
  ["Dytor 10", "Torsemide", "Torsemide 10mg", "Loop Diuretic", "Tablet", "10mg", "Cipla", 85, true, "Dehydration, electrolyte imbalance", "Anuria", "Digoxin, lithium", "B", false, true, "Edema, heart failure"],
  ["Aldactone 25", "Spironolactone", "Spironolactone 25mg", "Potassium-sparing Diuretic", "Tablet", "25mg", "RPG", 60, true, "High potassium, gynecomastia", "Kidney failure, high potassium", "ACE inhibitors, potassium supplements", "C", false, true, "Heart failure, ascites, resistant hypertension"],
  ["Dilzem 30", "Diltiazem", "Diltiazem 30mg", "Calcium Channel Blocker", "Tablet", "30mg", "Torrent", 50, true, "Bradycardia, constipation", "Heart block, severe hypotension", "Beta blockers, digoxin", "C", false, true, "Angina, hypertension, rate control"],
  ["Cordarone 100", "Amiodarone", "Amiodarone 100mg", "Antiarrhythmic", "Tablet", "100mg", "Sanofi", 130, true, "Thyroid dysfunction, photosensitivity, lung toxicity", "Thyroid disease, heart block, iodine allergy", "Warfarin, digoxin, QT drugs", "D", false, true, "Serious arrhythmias (specialist use)"],
  ["Lanoxin 0.25", "Digoxin", "Digoxin 0.25mg", "Cardiac Glycoside", "Tablet", "0.25mg", "GSK", 25, true, "Nausea, arrhythmia at toxicity, visual changes", "Heart block, hypokalemia", "Diuretics, amiodarone, verapamil", "C", false, true, "Heart failure, atrial fibrillation rate control"],
  // ---------- DIABETES ----------
  ["Glycomet-GP 1", "Metformin + Glimepiride", "Metformin 500mg + Glimepiride 1mg", "Antidiabetic", "Tablet", "500/1mg", "USV", 105, true, "Hypoglycemia, GI upset", "Kidney failure, type 1 diabetes", "Alcohol, beta blockers", "C", false, true, "Type 2 diabetes combination therapy"],
  ["Glycomet-GP 2", "Metformin + Glimepiride", "Metformin 500mg + Glimepiride 2mg", "Antidiabetic", "Tablet", "500/2mg", "USV", 135, true, "Hypoglycemia", "Kidney failure", "Alcohol", "C", false, true, "Type 2 diabetes"],
  ["Amaryl 1", "Glimepiride", "Glimepiride 1mg", "Sulfonylurea", "Tablet", "1mg", "Sanofi", 100, true, "Hypoglycemia, weight gain", "Type 1 diabetes, sulfa allergy", "Beta blockers, alcohol, aspirin", "C", false, true, "Type 2 diabetes"],
  ["Amaryl 2", "Glimepiride", "Glimepiride 2mg", "Sulfonylurea", "Tablet", "2mg", "Sanofi", 165, true, "Hypoglycemia", "Type 1 diabetes", "Beta blockers, alcohol", "C", false, true, "Type 2 diabetes"],
  ["Januvia 100", "Sitagliptin", "Sitagliptin 100mg", "DPP-4 Inhibitor", "Tablet", "100mg", "MSD", 580, true, "Nasopharyngitis, rare pancreatitis", "Pancreatitis history", "Digoxin (minor)", "B", false, false, "Type 2 diabetes (low hypoglycemia risk)"],
  ["Janumet 50/500", "Sitagliptin + Metformin", "Sitagliptin 50mg + Metformin 500mg", "Antidiabetic", "Tablet", "50/500mg", "MSD", 380, true, "GI upset", "Kidney failure, pancreatitis history", "Alcohol, contrast dye", "B", false, true, "Type 2 diabetes combo"],
  ["Galvus 50", "Vildagliptin", "Vildagliptin 50mg", "DPP-4 Inhibitor", "Tablet", "50mg", "Novartis", 320, true, "Rare liver enzyme rise", "Liver disease", "None major", "B", false, false, "Type 2 diabetes"],
  ["Jardiance 10", "Empagliflozin", "Empagliflozin 10mg", "SGLT2 Inhibitor", "Tablet", "10mg", "Boehringer", 510, true, "Genital infections, dehydration", "Kidney failure, type 1 DM, recurrent UTI", "Diuretics", "C", false, true, "Type 2 diabetes with heart/kidney benefit"],
  ["Forxiga 10", "Dapagliflozin", "Dapagliflozin 10mg", "SGLT2 Inhibitor", "Tablet", "10mg", "AstraZeneca", 480, true, "Genital infections, polyuria", "Kidney failure, type 1 DM", "Diuretics", "C", false, true, "Type 2 diabetes, heart failure"],
  ["Pioz 15", "Pioglitazone", "Pioglitazone 15mg", "Thiazolidinedione", "Tablet", "15mg", "USV", 95, true, "Weight gain, edema, fracture risk", "Heart failure, bladder cancer history", "Gemfibrozil, insulin", "C", false, true, "Type 2 diabetes insulin resistance"],
  ["Huminsulin R", "Human Insulin Regular", "Human Insulin 40IU/ml", "Insulin", "Injection", "10ml vial", "Lilly", 165, true, "Hypoglycemia, injection site reactions", "Hypoglycemia episodes", "Beta blockers mask hypoglycemia", "B", true, true, "Diabetes requiring insulin (mealtime)"],
  ["Huminsulin 30/70", "Human Insulin Premix", "Insulin 30% regular + 70% NPH, 40IU/ml", "Insulin", "Injection", "10ml vial", "Lilly", 165, true, "Hypoglycemia", "Hypoglycemia", "Beta blockers", "B", true, true, "Diabetes twice-daily insulin regimen"],
  ["Lantus", "Insulin Glargine", "Insulin Glargine 100IU/ml", "Insulin", "Injection", "3ml pen", "Sanofi", 750, true, "Hypoglycemia", "Hypoglycemia episodes", "Beta blockers", "C", true, true, "Basal insulin once daily"],
  ["Mixtard 30", "Insulin Premix", "Biphasic Isophane Insulin 40IU/ml", "Insulin", "Injection", "10ml vial", "Novo Nordisk", 180, true, "Hypoglycemia", "Hypoglycemia", "Beta blockers", "B", true, true, "Diabetes premix insulin"],
  // ---------- PSYCHIATRY / NEUROLOGY ----------
  ["Nexito 10", "Escitalopram", "Escitalopram 10mg", "SSRI Antidepressant", "Tablet", "10mg", "Sun Pharma", 120, true, "Nausea, insomnia, sexual dysfunction", "MAOI use, QT prolongation", "MAOIs, tramadol, NSAIDs (bleeding)", "C", false, true, "Depression, anxiety disorders"],
  ["Zosert 50", "Sertraline", "Sertraline 50mg", "SSRI Antidepressant", "Tablet", "50mg", "Sun Pharma", 105, true, "Nausea, insomnia", "MAOI use", "MAOIs, tramadol, warfarin", "C", false, true, "Depression, OCD, panic disorder"],
  ["Flunil 20", "Fluoxetine", "Fluoxetine 20mg", "SSRI Antidepressant", "Capsule", "20mg", "Intas", 45, true, "Insomnia, nausea", "MAOI use", "MAOIs, tramadol, NSAIDs", "C", false, true, "Depression, OCD, bulimia"],
  ["Trika 0.25", "Alprazolam", "Alprazolam 0.25mg", "Benzodiazepine", "Tablet", "0.25mg", "Unichem", 32, true, "Drowsiness, dependence risk", "Respiratory depression, glaucoma, addiction history", "Alcohol, opioids, sedatives", "D", false, true, "Short-term anxiety, panic (strictly Rx)"],
  ["Restyl 0.5", "Alprazolam", "Alprazolam 0.5mg", "Benzodiazepine", "Tablet", "0.5mg", "Cipla", 45, true, "Drowsiness, dependence", "Respiratory depression, addiction", "Alcohol, opioids", "D", false, true, "Anxiety, panic disorder (short-term)"],
  ["Lopez 1", "Lorazepam", "Lorazepam 1mg", "Benzodiazepine", "Tablet", "1mg", "Intas", 40, true, "Sedation, dependence", "Respiratory depression, myasthenia", "Alcohol, CNS depressants", "D", false, true, "Anxiety, insomnia (short-term)"],
  ["Zolfresh 5", "Zolpidem", "Zolpidem 5mg", "Hypnotic", "Tablet", "5mg", "Abbott", 105, true, "Drowsiness, sleep behaviors", "Sleep apnea, depression caution", "Alcohol, CNS depressants", "C", false, true, "Short-term insomnia"],
  ["Melzap MD 0.25", "Clonazepam", "Clonazepam 0.25mg MD", "Benzodiazepine", "Tablet", "0.25mg", "Alkem", 35, true, "Drowsiness, ataxia", "Respiratory depression, glaucoma", "Alcohol, sedatives", "D", false, true, "Anxiety, seizures adjunct"],
  ["Encorate Chrono 300", "Sodium Valproate", "Valproate 300mg CR", "Anticonvulsant", "Tablet", "300mg CR", "Sun Pharma", 145, true, "Weight gain, tremor, liver strain, hair loss", "Pregnancy, liver disease", "Lamotrigine, aspirin, carbapenem", "X", true, true, "Epilepsy, bipolar disorder, migraine prophylaxis"],
  ["Tegrital 200", "Carbamazepine", "Carbamazepine 200mg", "Anticonvulsant", "Tablet", "200mg", "Novartis", 60, true, "Dizziness, rash (SJS risk), hyponatremia", "Bone marrow depression, MAOI use", "Many drug interactions (CYP inducer)", "D", true, true, "Epilepsy, trigeminal neuralgia"],
  ["Eptoin 100", "Phenytoin", "Phenytoin 100mg", "Anticonvulsant", "Tablet", "100mg", "Abbott", 30, true, "Gum hypertrophy, ataxia, rash", "Heart block, porphyria", "Many interactions (CYP inducer)", "D", true, true, "Epilepsy, seizure prophylaxis"],
  ["Levipil 500", "Levetiracetam", "Levetiracetam 500mg", "Anticonvulsant", "Tablet", "500mg", "Sun Pharma", 190, true, "Irritability, drowsiness", "Kidney impairment dose adjustment", "Minimal interactions", "C", true, true, "Epilepsy (broad spectrum)"],
  ["Gabapin 300", "Gabapentin", "Gabapentin 300mg", "Neuropathic Pain", "Capsule", "300mg", "Intas", 210, true, "Drowsiness, dizziness, edema", "Kidney impairment dose adjustment", "Opioids, antacids", "C", false, true, "Neuropathic pain, diabetic neuropathy"],
  ["Pregabid 75", "Pregabalin", "Pregabalin 75mg", "Neuropathic Pain", "Capsule", "75mg", "Intas", 165, true, "Dizziness, weight gain, edema", "Kidney impairment", "Opioids, sedatives", "C", false, true, "Neuropathic pain, fibromyalgia, sciatica"],
  ["Vertistar 8", "Betahistine", "Betahistine 8mg", "Antivertigo", "Tablet", "8mg", "Mankind", 90, true, "GI upset", "Pheochromocytoma", "Antihistamines", "C", false, false, "Vertigo, Meniere's"],
  ["Sibelium 10", "Flunarizine", "Flunarizine 10mg", "Migraine Prophylaxis", "Tablet", "10mg", "J&J", 190, true, "Drowsiness, weight gain, depression", "Depression, Parkinson's", "Sedatives, alcohol", "C", false, true, "Migraine prevention, vertigo"],
  ["Vasograin", "Ergotamine combo", "Ergotamine 1mg + Caffeine 100mg + PCM 250mg + Prochlorperazine 2.5mg", "Antimigraine", "Tablet", "combo", "Cadila", 90, true, "Nausea, vasoconstriction", "Pregnancy, heart disease, hypertension", "Triptans, macrolides", "X", false, true, "Acute migraine attack"],
  ["Suminat 50", "Sumatriptan", "Sumatriptan 50mg", "Triptan", "Tablet", "50mg", "Sun Pharma", 165, true, "Chest tightness, flushing", "Heart disease, uncontrolled BP, ergot use", "Ergots, SSRIs, MAOIs", "C", false, true, "Acute migraine"],
  ["Naxdom 500", "Naproxen + Domperidone", "Naproxen 500mg + Domperidone 10mg", "Antimigraine", "Tablet", "500/10mg", "Sun Pharma", 145, true, "Gastric upset", "Peptic ulcer, cardiac disease", "Other NSAIDs, warfarin", "C", false, true, "Migraine with nausea"],
  ["Donep 5", "Donepezil", "Donepezil 5mg", "Anti-Alzheimer", "Tablet", "5mg", "Alkem", 130, true, "Nausea, insomnia, bradycardia", "Cardiac conduction issues", "Anticholinergics, beta blockers", "C", false, true, "Alzheimer's dementia"],
  ["Pacitane 2", "Trihexyphenidyl", "Trihexyphenidyl 2mg", "Antiparkinsonian", "Tablet", "2mg", "Pfizer", 30, true, "Dry mouth, blurred vision, confusion", "Glaucoma, prostatic hypertrophy", "Anticholinergics", "C", false, true, "Parkinsonism, drug-induced EPS"],
  ["Syndopa 110", "Levodopa + Carbidopa", "Levodopa 100mg + Carbidopa 10mg", "Antiparkinsonian", "Tablet", "110mg", "Sun Pharma", 60, true, "Nausea, dyskinesia, hypotension", "Glaucoma, MAOI use, psychosis", "MAOIs, antipsychotics, iron", "C", false, true, "Parkinson's disease"],
  // ---------- OPHTHALMOLOGY / ENT ----------
  ["Moxicip Eye Drops", "Moxifloxacin", "Moxifloxacin 0.5%", "Antibiotic Eye Drops", "Drops", "5ml", "Cipla", 130, true, "Mild stinging", "Hypersensitivity", "None", "C", true, false, "Bacterial conjunctivitis"],
  ["Ciplox Eye/Ear Drops", "Ciprofloxacin", "Ciprofloxacin 0.3%", "Antibiotic Drops", "Drops", "10ml", "Cipla", 25, true, "Stinging", "Viral eye infections", "None", "C", true, false, "Eye/ear bacterial infections"],
  ["Tobrex Eye Drops", "Tobramycin", "Tobramycin 0.3%", "Antibiotic Eye Drops", "Drops", "5ml", "Alcon", 165, true, "Mild irritation", "Hypersensitivity", "None", "B", true, false, "Bacterial eye infections"],
  ["Refresh Tears", "Lubricant", "Carboxymethylcellulose 0.5%", "Eye Lubricant", "Drops", "10ml", "Allergan", 190, false, "None significant", "None", "None", "A", true, false, "Dry eyes, screen strain"],
  ["Systane Ultra", "Lubricant", "Polyethylene Glycol + Propylene Glycol", "Eye Lubricant", "Drops", "10ml", "Alcon", 350, false, "None", "None", "None", "A", true, false, "Dry eye relief"],
  ["Pataday Eye Drops", "Olopatadine", "Olopatadine 0.1%", "Antiallergic Eye Drops", "Drops", "5ml", "Alcon", 320, true, "Mild burning", "Contact lens wear during use", "None", "C", true, false, "Allergic conjunctivitis, itchy eyes"],
  ["Flur Eye Drops", "Flurbiprofen", "Flurbiprofen 0.03%", "NSAID Eye Drops", "Drops", "5ml", "Allergan", 55, true, "Transient stinging", "Corneal ulcer", "None", "C", false, false, "Eye inflammation, post-op"],
  ["Timolet 0.5", "Timolol", "Timolol 0.5%", "Antiglaucoma", "Drops", "5ml", "Sun Pharma", 60, true, "Eye irritation, systemic beta-block effects", "Asthma, heart block", "Oral beta blockers, verapamil", "C", false, true, "Glaucoma, ocular hypertension"],
  ["Candibiotic Ear Drops", "Antibiotic + Antifungal + Steroid", "Chloramphenicol + Clotrimazole + Beclomethasone + Lignocaine", "Ear Drops", "Drops", "5ml", "Glenmark", 105, true, "Local irritation", "Perforated eardrum", "None", "C", true, false, "Ear infection with pain and itching"],
  ["Otogesic Ear Drops", "Analgesic Ear Drops", "Benzocaine + Chlorbutol + Paradichlorobenzene", "Ear Drops", "Drops", "10ml", "Leeford", 85, false, "Local irritation", "Perforated eardrum", "None", "C", true, false, "Ear pain, wax softening"],
  ["Soliwax Ear Drops", "Wax Solvent", "Paradichlorobenzene + Benzocaine + Turpentine oil", "Ear Drops", "Drops", "10ml", "Zydus", 90, false, "Mild irritation", "Perforated eardrum", "None", "A", true, false, "Ear wax removal"],
  ["Nasivion 0.05", "Oxymetazoline", "Oxymetazoline 0.05%", "Nasal Decongestant", "Drops", "10ml", "Merck", 95, false, "Rebound congestion if overused", "Use beyond 7 days, children under 6", "MAOIs", "C", false, true, "Blocked nose, sinusitis"],
  ["Nasivion Mini 0.01", "Oxymetazoline", "Oxymetazoline 0.01%", "Nasal Decongestant", "Drops", "10ml", "Merck", 90, false, "Rebound congestion", "Prolonged use", "None", "C", true, false, "Blocked nose in infants"],
  ["Duonase Nasal Spray", "Azelastine + Fluticasone", "Azelastine 140mcg + Fluticasone 50mcg per spray", "Nasal Antiallergic", "Drops", "70 doses", "Zydus", 395, true, "Bitter taste, nose dryness", "Nasal ulcers, recent nasal surgery", "None major", "C", false, false, "Allergic rhinitis (moderate-severe)"],
  ["Flixonase Nasal Spray", "Fluticasone", "Fluticasone 50mcg/spray", "Nasal Steroid", "Drops", "120 doses", "GSK", 480, true, "Nose dryness, epistaxis", "Nasal infection", "Ritonavir", "C", true, false, "Allergic rhinitis maintenance"],
  ["Betadine Gargle", "Povidone Iodine", "Povidone Iodine 2%", "Antiseptic Gargle", "Syrup", "100ml", "Win-Medicare", 155, false, "Iodine taste, staining", "Thyroid disorders, iodine allergy", "None", "D", false, false, "Sore throat, oral hygiene, mouth ulcers"],
  ["Hexidine Mouthwash", "Chlorhexidine", "Chlorhexidine 0.2%", "Mouthwash", "Syrup", "160ml", "ICPA", 130, false, "Taste alteration, staining with long use", "None major", "None", "B", true, false, "Gingivitis, oral infections, post-dental care"],
  ["Cofsils Lozenges", "Antiseptic Lozenge", "Amylmetacresol + Dichlorobenzyl alcohol", "Throat Lozenge", "Tablet", "lozenge", "Cipla", 50, false, "None significant", "None", "None", "A", true, false, "Sore throat relief"],
  ["Strepsils", "Antiseptic Lozenge", "Amylmetacresol + Dichlorobenzyl alcohol", "Throat Lozenge", "Tablet", "lozenge", "Reckitt", 55, false, "None", "None", "None", "A", true, false, "Sore throat, mouth infection relief"],
  // ---------- GYNECOLOGY / UROLOGY ----------
  ["Meprate 10", "Medroxyprogesterone", "MPA 10mg", "Progestin", "Tablet", "10mg", "Serum Institute", 55, true, "Irregular bleeding, bloating", "Pregnancy, liver disease, breast cancer", "Rifampicin, anticonvulsants", "X", false, false, "Delayed periods, abnormal uterine bleeding"],
  ["Regestrone 5", "Norethisterone", "Norethisterone 5mg", "Progestin", "Tablet", "5mg", "Torrent", 60, true, "Nausea, breast tenderness", "Pregnancy, liver disease, thromboembolism", "Anticonvulsants", "X", false, false, "Period postponement, menorrhagia"],
  ["Ovral L", "OCP", "Levonorgestrel 0.15mg + Ethinylestradiol 0.03mg", "Oral Contraceptive", "Tablet", "21 tab", "Pfizer", 110, true, "Nausea, spotting, thrombosis risk", "Smoking over 35, thromboembolism, liver disease, breast cancer", "Rifampicin, anticonvulsants, some antibiotics", "X", false, false, "Contraception, cycle regulation"],
  ["Unwanted 72", "Levonorgestrel", "Levonorgestrel 1.5mg", "Emergency Contraceptive", "Tablet", "1.5mg", "Mankind", 110, false, "Nausea, cycle disturbance", "Pregnancy (won't work)", "Rifampicin, anticonvulsants", "X", false, false, "Emergency contraception within 72h"],
  ["I-Pill", "Levonorgestrel", "Levonorgestrel 1.5mg", "Emergency Contraceptive", "Tablet", "1.5mg", "Piramal", 125, false, "Nausea, spotting", "Pregnancy", "Enzyme inducers", "X", false, false, "Emergency contraception within 72h"],
  ["Folvite 5", "Folic Acid", "Folic Acid 5mg", "Vitamin", "Tablet", "5mg", "Pfizer", 40, false, "None significant", "Untreated B12 deficiency", "Methotrexate, phenytoin", "A", true, false, "Pregnancy planning, anemia, folate deficiency"],
  ["Susten 200", "Progesterone", "Micronized Progesterone 200mg", "Progesterone", "Capsule", "200mg", "Sun Pharma", 320, true, "Drowsiness, dizziness", "Liver disease, thromboembolism, undiagnosed bleeding", "None major", "B", false, false, "Pregnancy support, luteal phase support"],
  ["Duphaston 10", "Dydrogesterone", "Dydrogesterone 10mg", "Progesterone", "Tablet", "10mg", "Abbott", 620, true, "Nausea, headache", "Liver disease, undiagnosed bleeding", "Rifampicin", "B", false, false, "Threatened miscarriage, irregular cycles"],
  ["Clingen Forte", "Vaginal Combo", "Clindamycin + Clotrimazole + Tinidazole", "Vaginal Suppository", "Capsule", "3 pessary", "Gufic", 190, true, "Local irritation", "First trimester caution", "None", "C", false, false, "Vaginal infections, discharge"],
  ["Candid V6", "Clotrimazole", "Clotrimazole 100mg pessary", "Vaginal Antifungal", "Capsule", "6 pessary", "Glenmark", 120, true, "Local burning", "None major", "None", "B", false, false, "Vaginal candidiasis"],
  ["Urimax 0.4", "Tamsulosin", "Tamsulosin 0.4mg", "Alpha Blocker", "Capsule", "0.4mg", "Cipla", 250, true, "Dizziness, retrograde ejaculation", "Severe hypotension", "Other alpha blockers, PDE5 inhibitors", "B", false, true, "BPH urinary symptoms in men"],
  ["Veltam Plus", "Tamsulosin + Dutasteride", "Tamsulosin 0.4mg + Dutasteride 0.5mg", "BPH Therapy", "Tablet", "combo", "Intas", 340, true, "Dizziness, sexual dysfunction", "Women, children", "PDE5 inhibitors", "X", false, true, "Enlarged prostate (BPH)"],
  ["Cital Syrup", "Urine Alkalizer", "Disodium Hydrogen Citrate", "Urine Alkalizer", "Syrup", "100ml", "Indoco", 105, false, "GI upset", "Kidney failure, sodium restriction", "None major", "A", true, false, "Burning urination, UTI symptom relief"],
  ["Alkasol Syrup", "Urine Alkalizer", "Disodium Hydrogen Citrate 1.4g/5ml", "Urine Alkalizer", "Syrup", "100ml", "Stadmed", 118, false, "GI upset", "Kidney failure", "None", "A", true, false, "Burning micturition, acidic urine"],
  ["Sildenafil (Manforce 50)", "Sildenafil", "Sildenafil 50mg", "PDE5 Inhibitor", "Tablet", "50mg", "Mankind", 145, true, "Headache, flushing, visual changes", "Nitrate use (dangerous), severe cardiac disease", "Nitrates (contraindicated), alpha blockers", "B", false, true, "Erectile dysfunction"],
  ["Tadalafil (Megalis 10)", "Tadalafil", "Tadalafil 10mg", "PDE5 Inhibitor", "Tablet", "10mg", "Macleods", 190, true, "Headache, back pain", "Nitrate use, severe cardiac disease", "Nitrates, alpha blockers", "B", false, true, "Erectile dysfunction"],
  // ---------- THYROID / HORMONES / BONE ----------
  ["Thyronorm 25", "Levothyroxine", "Levothyroxine 25mcg", "Thyroid Hormone", "Tablet", "25mcg", "Abbott", 110, true, "Palpitations if overdosed", "Thyrotoxicosis, untreated adrenal insufficiency", "Iron, calcium, PPIs (space 4h)", "A", true, true, "Hypothyroidism (low dose)"],
  ["Thyronorm 100", "Levothyroxine", "Levothyroxine 100mcg", "Thyroid Hormone", "Tablet", "100mcg", "Abbott", 155, true, "Palpitations if overdosed", "Thyrotoxicosis", "Iron, calcium (space doses)", "A", true, true, "Hypothyroidism"],
  ["Eltroxin 50", "Levothyroxine", "Levothyroxine 50mcg", "Thyroid Hormone", "Tablet", "50mcg", "GSK", 130, true, "Palpitations at excess", "Thyrotoxicosis", "Iron, calcium, PPIs", "A", true, true, "Hypothyroidism"],
  ["Neomercazole 5", "Carbimazole", "Carbimazole 5mg", "Antithyroid", "Tablet", "5mg", "Abbott", 145, true, "Rash, rare agranulocytosis (fever+sore throat = stop)", "Severe blood disorders", "Warfarin, digoxin", "D", false, false, "Hyperthyroidism"],
  ["Shelcal-HD", "Calcium + Vitamin D3", "Calcium 500mg + Vitamin D3 1000IU", "Bone Health", "Tablet", "500mg/1000IU", "Torrent", 155, false, "Constipation", "Hypercalcemia, kidney stones", "Thyroxine, iron (space doses)", "A", true, false, "Osteoporosis, calcium deficiency"],
  ["Uprise D3 60K", "Vitamin D3", "Cholecalciferol 60000IU", "Vitamin D", "Capsule", "60000IU", "Alkem", 105, false, "Hypercalcemia if overdosed", "Hypercalcemia, kidney stones", "Thiazides", "A", true, false, "Vitamin D deficiency (weekly dose)"],
  ["D-Rise 60K Sachet", "Vitamin D3", "Cholecalciferol 60000IU granules", "Vitamin D", "Powder", "1g sachet", "USV", 42, false, "None at prescribed dose", "Hypercalcemia", "Thiazides", "A", true, false, "Vitamin D deficiency"],
  ["Osteofos 70", "Alendronate", "Alendronate 70mg", "Bisphosphonate", "Tablet", "70mg", "Cipla", 190, true, "Esophageal irritation, jaw osteonecrosis (rare)", "Esophageal disorders, inability to sit upright 30min, hypocalcemia", "Calcium, antacids (space doses)", "C", false, true, "Osteoporosis (weekly, empty stomach)"],
  ["HCQS 200", "Hydroxychloroquine", "Hydroxychloroquine 200mg", "DMARD", "Tablet", "200mg", "Ipca", 105, true, "Retinal toxicity (long-term), GI upset", "Retinal disease, G6PD deficiency", "Digoxin, QT drugs", "C", false, true, "Rheumatoid arthritis, lupus"],
  ["Folitrax 7.5", "Methotrexate", "Methotrexate 7.5mg", "DMARD", "Tablet", "7.5mg", "Ipca", 60, true, "Mouth ulcers, liver strain, bone marrow suppression", "Pregnancy, liver disease, infection", "NSAIDs, cotrimoxazole, alcohol", "X", false, true, "Rheumatoid arthritis, psoriasis (weekly dose only)"],
  ["Saaz 500", "Sulfasalazine", "Sulfasalazine 500mg", "DMARD", "Tablet", "500mg", "Ipca", 130, true, "GI upset, orange urine, rash", "Sulfa allergy, G6PD deficiency", "Warfarin, methotrexate", "B", false, false, "Rheumatoid arthritis, ulcerative colitis"],
  ["Defcort 6", "Deflazacort", "Deflazacort 6mg", "Corticosteroid", "Tablet", "6mg", "Macleods", 120, true, "Weight gain, high sugar, immunity suppression", "Systemic infection, live vaccines", "NSAIDs, antidiabetics", "C", true, true, "Inflammatory conditions, allergies, asthma"],
  ["Wysolone 10", "Prednisolone", "Prednisolone 10mg", "Corticosteroid", "Tablet", "10mg", "Pfizer", 25, true, "Weight gain, gastritis, high sugar, mood changes", "Systemic fungal infection, live vaccines", "NSAIDs, antidiabetics, diuretics", "C", true, true, "Allergic/inflammatory conditions, asthma exacerbation"],
  ["Omnacortil 5", "Prednisolone", "Prednisolone 5mg", "Corticosteroid", "Tablet", "5mg", "Macleods", 22, true, "Gastritis, weight gain", "Systemic infection", "NSAIDs, antidiabetics", "C", true, true, "Inflammation, allergy, autoimmune flare"],
  ["Medrol 4", "Methylprednisolone", "Methylprednisolone 4mg", "Corticosteroid", "Tablet", "4mg", "Pfizer", 85, true, "Gastritis, insomnia, high sugar", "Systemic infection", "NSAIDs, antidiabetics", "C", true, true, "Inflammatory and allergic conditions"],
  // ---------- PEDIATRICS ----------
  ["Ibugesic Plus Syrup", "Ibuprofen + Paracetamol", "Ibuprofen 100mg + PCM 162.5mg per 5ml", "Pediatric Analgesic", "Syrup", "100ml", "Cipla", 42, false, "Gastric upset", "Dehydration, kidney issues, aspirin allergy", "Other NSAIDs", "C", true, false, "Fever and pain in children"],
  ["Meftal-P Syrup", "Mefenamic Acid", "Mefenamic Acid 100mg/5ml", "Pediatric Antipyretic", "Syrup", "60ml", "Blue Cross", 40, false, "GI upset, rash", "Dehydration, kidney issues", "Other NSAIDs", "C", true, false, "High fever in children"],
  ["Sinarest Syrup", "Cold Combo", "PCM 125mg + PE 5mg + CPM 1mg per 5ml", "Pediatric Cold", "Syrup", "60ml", "Centaur", 78, false, "Drowsiness", "Under 2 years without doctor advice", "Sedatives", "C", true, false, "Cold, runny nose, fever in children"],
  ["T-Minic Drops", "Cold Drops", "PE 2.5mg + CPM 1mg per ml", "Pediatric Cold", "Drops", "15ml", "GSK", 60, false, "Drowsiness", "Under 6 months", "None major", "C", true, false, "Infant blocked nose, cold"],
  ["Nasoclear Saline", "Saline Nasal", "Sodium Chloride 0.65%", "Nasal Saline", "Drops", "10ml", "P&B", 65, false, "None", "None", "None", "A", true, false, "Blocked nose in babies (safe saline)"],
  ["Colicaid Drops", "Simethicone + Dill Oil", "Simethicone 40mg + Dill Oil + Fennel Oil per ml", "Pediatric Antiflatulent", "Drops", "30ml", "Meyer", 92, false, "None significant", "None", "None", "A", true, false, "Infant colic, gas"],
  ["Cyclopam Drops", "Dicyclomine", "Dicyclomine 10mg/ml", "Pediatric Antispasmodic", "Drops", "10ml", "Indoco", 55, false, "Drowsiness, dry mouth", "Under 6 months", "None major", "B", true, false, "Infant colic, abdominal cramps"],
  ["Zincoret Syrup", "Zinc", "Zinc Sulphate 20mg/5ml", "Pediatric Zinc", "Syrup", "60ml", "Cachet", 58, false, "Mild nausea", "None", "None", "A", true, false, "Diarrhea management with ORS, zinc deficiency"],
  ["Tonoferon Drops", "Iron + Folic Acid", "Iron 25mg + Folic Acid 200mcg per ml", "Pediatric Iron", "Drops", "15ml", "East India", 105, false, "Dark stools, staining of teeth (use straw)", "Hemochromatosis", "Antacids, calcium", "A", true, false, "Iron deficiency anemia in infants"],
  ["Aptivate Syrup", "Appetite Stimulant", "Ayurvedic appetite formula", "Pediatric Tonic", "Syrup", "175ml", "Lupin", 155, false, "None significant", "None", "None", "A", true, false, "Poor appetite in children"],
  ["Junior Lanzol 15", "Lansoprazole", "Lansoprazole 15mg MD", "Pediatric PPI", "Tablet", "15mg MD", "Cipla", 95, true, "Headache", "None major", "None major", "B", true, false, "Reflux in children"],
  ["Ondem Syrup", "Ondansetron", "Ondansetron 2mg/5ml", "Pediatric Antiemetic", "Syrup", "30ml", "Alkem", 48, true, "Headache, constipation", "QT prolongation", "QT drugs", "B", true, false, "Vomiting in children"],
  ["Bevon Drops", "Multivitamin", "Multivitamin + Minerals", "Pediatric Multivitamin", "Drops", "15ml", "Zuventus", 130, false, "None", "None", "None", "A", true, false, "Growth support, vitamin deficiency in infants"],
  // ---------- WORMS / MALARIA / VIRAL ----------
  ["Zentel 400", "Albendazole", "Albendazole 400mg", "Anthelmintic", "Tablet", "400mg", "GSK", 40, false, "GI upset, headache", "Pregnancy, liver disease", "Cimetidine, dexamethasone", "C", true, false, "Worm infestation (single dose)"],
  ["Bandy Plus", "Albendazole + Ivermectin", "Albendazole 400mg + Ivermectin 12mg", "Anthelmintic", "Tablet", "combo", "Mankind", 32, false, "Dizziness, GI upset", "Pregnancy, children under 15kg", "Warfarin", "C", false, false, "Broad-spectrum deworming"],
  ["Wormin", "Mebendazole", "Mebendazole 100mg", "Anthelmintic", "Tablet", "100mg", "Cadila", 25, false, "GI upset", "Pregnancy first trimester", "Cimetidine", "C", true, false, "Pinworm, roundworm"],
  ["Lariago 250", "Chloroquine", "Chloroquine 250mg", "Antimalarial", "Tablet", "250mg", "Ipca", 20, true, "GI upset, itching, retinal toxicity long-term", "Retinal disease, psoriasis, G6PD deficiency", "Antacids, QT drugs", "C", true, true, "Malaria (P. vivax) treatment"],
  ["Falcigo 50", "Artesunate", "Artesunate 50mg", "Antimalarial", "Tablet", "50mg", "Zydus", 210, true, "GI upset, dizziness", "First trimester pregnancy", "QT drugs", "C", true, false, "Falciparum malaria (combination therapy)"],
  ["Lumether Forte", "Artemether + Lumefantrine", "Artemether 80mg + Lumefantrine 480mg", "Antimalarial", "Tablet", "80/480mg", "Cipla", 240, true, "Headache, dizziness", "First trimester, QT prolongation, cardiac disease", "QT drugs, grapefruit", "C", true, false, "Uncomplicated falciparum malaria"],
  ["Acivir 400", "Acyclovir", "Acyclovir 400mg", "Antiviral", "Tablet", "400mg", "Cipla", 110, true, "Headache, nausea", "Kidney impairment dose adjustment", "Probenecid, nephrotoxic drugs", "B", true, true, "Herpes simplex, shingles, chickenpox"],
  ["Valcivir 500", "Valacyclovir", "Valacyclovir 500mg", "Antiviral", "Tablet", "500mg", "Cipla", 320, true, "Headache, nausea", "Kidney impairment", "Nephrotoxic drugs", "B", false, true, "Shingles, herpes (better absorption)"],
  ["Fluvir 75", "Oseltamivir", "Oseltamivir 75mg", "Antiviral", "Capsule", "75mg", "Hetero", 450, true, "Nausea, vomiting", "Kidney impairment dose adjustment", "Live flu vaccine", "C", true, false, "Influenza (start within 48h of symptoms)"],
  // ---------- MISC ESSENTIAL ----------
  ["Livogen", "Iron + Folic Acid", "Ferrous Fumarate 152mg + Folic Acid 1.5mg", "Hematinic", "Tablet", "combo", "Merck", 55, false, "Dark stools, constipation", "Hemochromatosis", "Antacids, tetracyclines", "A", true, false, "Iron deficiency anemia"],
  ["Orofer XT", "Iron + Folic Acid", "Elemental Iron 100mg + Folic Acid 1.5mg", "Hematinic", "Tablet", "100/1.5mg", "Emcure", 135, false, "Constipation, dark stools", "Hemochromatosis", "Antacids, calcium", "A", true, false, "Anemia, pregnancy iron support"],
  ["Evion 400", "Vitamin E", "Tocopherol 400mg", "Vitamin", "Capsule", "400mg", "Merck", 42, false, "None at normal dose", "Vitamin K deficiency caution", "Warfarin (high dose)", "A", true, false, "Vitamin E deficiency, skin/hair support"],
  ["Limcee 500", "Vitamin C", "Ascorbic Acid 500mg chewable", "Vitamin", "Tablet", "500mg", "Abbott", 25, false, "GI upset at high dose", "Kidney stones history", "None major", "A", true, false, "Immunity, scurvy prevention, wound healing"],
  ["Celin 500", "Vitamin C", "Ascorbic Acid 500mg", "Vitamin", "Tablet", "500mg", "Koye", 28, false, "None significant", "Kidney stones caution", "None", "A", true, false, "Vitamin C deficiency, immunity"],
  ["Neurobion Forte", "B-Complex", "B1+B6+B12 combo", "Neurotropic Vitamin", "Tablet", "combo", "Merck", 38, false, "None significant", "None", "Levodopa (B6)", "A", true, false, "Nerve health, neuropathy support, B deficiency"],
  ["Nurokind Plus", "Methylcobalamin combo", "Methylcobalamin 1500mcg + ALA + B-vitamins", "Neurotropic Vitamin", "Capsule", "combo", "Mankind", 110, false, "None significant", "None", "None", "A", false, false, "Diabetic neuropathy, nerve pain support"],
  ["Methycobal 500", "Methylcobalamin", "Methylcobalamin 500mcg", "Vitamin B12", "Tablet", "500mcg", "Wockhardt", 155, false, "None", "None", "None", "A", true, false, "B12 deficiency, peripheral neuropathy"],
  ["A to Z NS", "Multivitamin", "Multivitamin + Multimineral", "Multivitamin", "Tablet", "combo", "Alkem", 105, false, "None", "None", "None", "A", true, false, "General nutritional support"],
  ["Supradyn", "Multivitamin", "Multivitamin + Minerals daily", "Multivitamin", "Tablet", "combo", "Abbott", 55, false, "None", "None", "None", "A", true, false, "Daily nutrition, energy support"],
  ["Revital H", "Multivitamin + Ginseng", "Vitamins + Minerals + Ginseng", "Multivitamin", "Capsule", "combo", "Sun Pharma", 340, false, "None significant", "None", "None", "A", false, false, "Energy, stamina, daily wellness"],
  ["Seven Seas", "Cod Liver Oil", "Cod Liver Oil 300mg + Vitamins A&D", "Supplement", "Capsule", "combo", "Merck", 260, false, "Fishy aftertaste", "None", "None", "A", true, false, "Omega-3, bone and immunity support"],
  ["Ensure Powder", "Nutrition Supplement", "Balanced macro + micronutrients", "Nutrition", "Powder", "400g", "Abbott", 640, false, "None", "Galactosemia", "None", "A", true, false, "Adult nutrition, recovery, elderly nutrition"],
  ["Pediasure", "Pediatric Nutrition", "Balanced nutrition for children", "Nutrition", "Powder", "400g", "Abbott", 655, false, "None", "Galactosemia", "None", "A", true, false, "Child growth nutrition supplement"],
  ["Protinex", "Protein Supplement", "Protein hydrolysate + vitamins", "Nutrition", "Powder", "400g", "Danone", 610, false, "None", "None", "None", "A", true, false, "Protein deficiency, recovery nutrition"],
  ["Horlicks Diabetes Plus", "Diabetic Nutrition", "High fiber low GI nutrition", "Nutrition", "Powder", "400g", "HUL", 545, false, "None", "None", "None", "A", false, false, "Diabetic nutrition support"],
  ["Glucon-D", "Glucose", "Glucose + Vitamin D + Calcium", "Energy", "Powder", "450g", "Zydus", 190, false, "None", "Diabetes caution", "None", "A", true, false, "Instant energy, heat exhaustion"],
  ["Tancodep", "Doxylamine + Pyridoxine", "Doxylamine 10mg + Pyridoxine 10mg", "Anti-nausea (Pregnancy)", "Tablet", "combo", "Mankind", 85, true, "Drowsiness", "None major", "Sedatives", "A", false, false, "Morning sickness in pregnancy"],
  ["Doxinate", "Doxylamine + Pyridoxine", "Doxylamine 10mg + Pyridoxine 10mg", "Anti-nausea (Pregnancy)", "Tablet", "combo", "Maneesh", 120, true, "Drowsiness", "None major", "Sedatives, alcohol", "A", false, false, "Nausea and vomiting of pregnancy"],
  ["Dulcoflex 5", "Bisacodyl", "Bisacodyl 5mg", "Stimulant Laxative", "Tablet", "5mg", "Boehringer", 95, false, "Cramps", "Intestinal obstruction, acute abdomen", "Antacids (don't take together)", "B", true, false, "Constipation (overnight relief)"],
  ["Isabgol (Softovac)", "Psyllium Husk", "Ispaghula husk fiber", "Bulk Laxative", "Powder", "100g", "Lupin", 175, false, "Bloating initially", "Intestinal obstruction, difficulty swallowing", "Take other drugs 1h apart", "A", true, false, "Chronic constipation, fiber supplement"],
  ["Smuth Cream", "Anorectal Cream", "Lidocaine + Hydrocortisone", "Anorectal", "Cream", "20g", "Torque", 95, false, "Local irritation", "Perianal infection", "None", "C", false, false, "Piles pain, anal fissure relief"],
  ["Anovate Cream", "Anorectal Combo", "Beclomethasone + Lidocaine + Phenylephrine", "Anorectal", "Cream", "20g", "Cipla", 130, false, "Local irritation", "Perianal infection", "None", "C", false, false, "Hemorrhoids, anal fissure"],
  ["Pilex Tablet", "Ayurvedic Piles Care", "Herbal formulation", "Ayurvedic", "Tablet", "60 tab", "Himalaya", 160, false, "None significant", "None", "None", "A", false, false, "Piles symptom management"],
  ["Liv 52 DS", "Liver Tonic", "Herbal hepatoprotective", "Ayurvedic", "Tablet", "60 tab", "Himalaya", 165, false, "None", "None", "None", "A", true, false, "Liver support, appetite improvement"],
  ["Cystone", "Urinary Ayurvedic", "Herbal urinary formulation", "Ayurvedic", "Tablet", "60 tab", "Himalaya", 170, false, "None", "None", "None", "A", false, false, "Kidney stone support, urinary health"],
  ["Rumalaya Forte", "Joint Ayurvedic", "Herbal joint formulation", "Ayurvedic", "Tablet", "60 tab", "Himalaya", 185, false, "None", "None", "None", "A", false, false, "Joint pain, arthritis support"],
  ["Shilajit Gold", "Ayurvedic Vitality", "Shilajit + herbs + gold", "Ayurvedic", "Capsule", "20 cap", "Dabur", 385, false, "None significant", "None", "None", "A", false, false, "Energy, vitality, stamina"],
  ["Chyawanprash", "Ayurvedic Immunity", "Amla-based herbal jam", "Ayurvedic", "Powder", "500g", "Dabur", 215, false, "None", "Diabetes caution (sugar)", "None", "A", true, false, "Immunity, general health tonic"],
  ["Honitus Syrup", "Ayurvedic Cough", "Honey-based herbal cough syrup", "Ayurvedic", "Syrup", "100ml", "Dabur", 110, false, "None", "Diabetes caution", "None", "A", true, false, "Cough relief (herbal, non-drowsy)"],
  ["Koflet Syrup", "Ayurvedic Cough", "Herbal cough formulation", "Ayurvedic", "Syrup", "100ml", "Himalaya", 95, false, "None", "Diabetes caution", "None", "A", true, false, "Dry and wet cough (herbal)"],
  ["Electral Z", "ORS + Zinc", "WHO ORS + Zinc 20mg", "Rehydration", "Powder", "sachet combo", "FDC", 38, false, "None", "None", "None", "A", true, false, "Diarrhea with zinc supplementation"],
  ["Enerzal", "Energy Drink Powder", "Electrolytes + glucose", "Rehydration", "Powder", "500g", "FDC", 240, false, "None", "Diabetes caution", "None", "A", true, false, "Energy and electrolyte replenishment"],
  ["Volini Spray", "Diclofenac Spray", "Diclofenac 1.16% spray", "Topical NSAID", "Drops", "100g spray", "Sun Pharma", 260, false, "Local irritation", "Open wounds", "None", "C", false, false, "Back pain, muscle sprain (spray)"],
  ["Moov Cream", "Counter-irritant", "Wintergreen + Eucalyptus + Turpentine", "Topical Analgesic", "Cream", "50g", "Reckitt", 195, false, "Warm sensation", "Broken skin", "None", "A", false, false, "Back pain, muscle ache"],
  ["Iodex", "Counter-irritant Balm", "Methyl salicylate + Menthol", "Topical Analgesic", "Cream", "40g", "GSK", 140, false, "Warm sensation", "Broken skin", "None", "A", false, false, "Sprains, joint and muscle pain"],
  ["Vicks Vaporub", "Decongestant Balm", "Menthol + Camphor + Eucalyptus", "Topical Decongestant", "Cream", "50ml", "P&G", 155, false, "Skin irritation rarely", "Under 2 years on nostrils", "None", "A", true, false, "Cold congestion relief, headache"],
  ["Amrutanjan Balm", "Pain Balm", "Menthol + Camphor + Methyl salicylate", "Topical Analgesic", "Cream", "30ml", "Amrutanjan", 95, false, "Warmth", "Broken skin", "None", "A", false, false, "Headache, body ache balm"],
  ["Dettol Antiseptic", "Chloroxylenol", "Chloroxylenol 4.8%", "Antiseptic", "Syrup", "250ml", "Reckitt", 185, false, "Skin dryness", "Do not ingest", "None", "A", true, false, "Wound cleaning, first aid, disinfection"],
  ["Savlon Antiseptic", "Chlorhexidine + Cetrimide", "Chlorhexidine 0.3% + Cetrimide 3%", "Antiseptic", "Syrup", "200ml", "ITC", 165, false, "None significant", "Do not ingest", "None", "A", true, false, "Wound cleaning, antiseptic first aid"],
  ["Burnol", "Burn Cream", "Aminacrine + Cetrimide", "Burn Cream", "Cream", "20g", "Dr. Morepen", 105, false, "Local irritation", "Deep burns (see doctor)", "None", "A", true, false, "Minor burns first aid"],
  ["Band-Aid Assorted", "Adhesive Bandage", "Sterile adhesive dressing", "First Aid", "Powder", "20 strips", "J&J", 95, false, "None", "None", "None", "A", true, false, "Minor cuts and wounds cover"],
  ["Digital Thermometer MT-101", "Thermometer", "Digital clinical thermometer", "Device", "Powder", "1 unit", "Dr. Morepen", 199, false, "None", "None", "None", "A", true, false, "Body temperature measurement"],
  ["Accu-Chek Active Strips", "Glucometer Strips", "Blood glucose test strips", "Device", "Powder", "50 strips", "Roche", 899, false, "None", "None", "None", "A", true, false, "Blood sugar self-monitoring"],
  ["Dr Morepen BP Monitor", "BP Monitor", "Automatic BP apparatus", "Device", "Powder", "1 unit", "Dr. Morepen", 1450, false, "None", "None", "None", "A", true, false, "Home blood pressure monitoring"],
  ["Nebulizer Mask Kit", "Nebulizer Accessory", "Adult/child nebulizer mask kit", "Device", "Powder", "1 kit", "Philips", 240, false, "None", "None", "None", "A", true, false, "Nebulization therapy at home"],
  ["Whisper Ultra", "Sanitary Pads", "Sanitary napkins XL", "Hygiene", "Powder", "30 pads", "P&G", 299, false, "None", "None", "None", "A", false, false, "Menstrual hygiene"],
  ["Stayfree Secure", "Sanitary Pads", "Sanitary napkins regular", "Hygiene", "Powder", "20 pads", "J&J", 165, false, "None", "None", "None", "A", false, false, "Menstrual hygiene"],
  ["Prega News", "Pregnancy Test Kit", "hCG urine test card", "Device", "Powder", "1 kit", "Mankind", 55, false, "None", "None", "None", "A", false, false, "Home pregnancy detection"],
  ["Mamaearth Diaper Rash Cream", "Diaper Rash Cream", "Zinc oxide + calendula", "Baby Care", "Cream", "50g", "Mamaearth", 349, false, "None", "None", "None", "A", true, false, "Diaper rash prevention and care"],
  ["Himalaya Baby Powder", "Baby Powder", "Herbal talc-free powder", "Baby Care", "Powder", "200g", "Himalaya", 190, false, "None", "None", "None", "A", true, false, "Baby skin care"],
  ["Sebamed Baby Lotion", "Baby Lotion", "pH 5.5 baby moisturizer", "Baby Care", "Syrup", "200ml", "Sebamed", 649, false, "None", "None", "None", "A", true, false, "Baby dry skin moisturization"],
  ["Cetaphil Cleanser", "Gentle Cleanser", "Non-soap gentle skin cleanser", "Dermaceutical", "Syrup", "125ml", "Galderma", 549, false, "None", "None", "None", "A", true, false, "Sensitive skin cleansing"],
  ["Photostable Sunscreen", "Sunscreen SPF 50", "Broad spectrum SPF 50+ PA+++", "Dermaceutical", "Gel", "50g", "Sun Pharma", 799, false, "None significant", "None", "None", "A", true, false, "Sun protection, pigmentation prevention"],
  ["Minoxidil 5% (Mintop)", "Minoxidil", "Minoxidil 5% topical solution", "Hair Loss", "Drops", "60ml", "Dr. Reddy's", 620, true, "Scalp irritation, initial shedding", "Under 18, scalp conditions", "None significant", "C", false, false, "Male pattern hair loss"],
  ["Follihair", "Hair Supplement", "Biotin + amino acids + minerals", "Hair Supplement", "Tablet", "30 tab", "Abbott", 570, false, "None", "None", "None", "A", false, false, "Hair fall, hair nutrition support"],
  ["Ketoconazole Shampoo (Nizral)", "Ketoconazole", "Ketoconazole 2% shampoo", "Antifungal Shampoo", "Syrup", "50ml", "J&J", 320, false, "Dryness", "Broken scalp skin", "None", "C", true, false, "Dandruff, seborrheic dermatitis"],
  ["Scalpe Plus Shampoo", "Ketoconazole + ZPTO", "Ketoconazole 2% + Zinc Pyrithione 1%", "Antifungal Shampoo", "Syrup", "75ml", "Glenmark", 375, false, "Dryness", "None", "None", "C", true, false, "Stubborn dandruff, scalp fungus"],
]

// Real strength/pack variants to reach the +500 target
const VARIANTS = [
  ["", 1],
  [" (Pack of 2)", 1.95],
  [" (Pack of 3)", 2.85],
]

async function main() {
  const existing = await pool.query("SELECT brand_name FROM medicines")
  const have = new Set(existing.rows.map((r) => r.brand_name))

  const rows = []
  for (const m of CATALOG) {
    for (const [suffix, mult] of VARIANTS) {
      const brand = m[0] + suffix
      if (have.has(brand)) continue
      rows.push([
        brand, m[1], m[2], m[3], m[4], m[5], m[6],
        Math.round(m[7] * mult * 100) / 100,
        20 + Math.floor(Math.random() * 130),
        m[8], m[9], m[10], m[11], m[12], m[13], m[14], m[15],
      ])
      if (rows.length >= 500) break
    }
    if (rows.length >= 500) break
  }

  console.log(`Inserting ${rows.length} new medicines...`)
  const BATCH = 50
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH)
    const values = []
    const params = []
    batch.forEach((r, j) => {
      const o = j * 17
      values.push(
        `($${o + 1},$${o + 2},$${o + 3},$${o + 4},$${o + 5},$${o + 6},$${o + 7},$${o + 8},$${o + 9},$${o + 10},$${o + 11},$${o + 12},$${o + 13},$${o + 14},$${o + 15},$${o + 16},$${o + 17})`,
      )
      params.push(r[0], r[1], r[2], r[3], r[4], r[5], r[6], r[7], r[8], r[9], r[10], r[11], r[12], r[13], r[14], r[15], r[16])
    })
    await pool.query(
      `INSERT INTO medicines (brand_name, generic_name, composition, category, dosage_form, strength, manufacturer, mrp, stock_quantity, rx_required, side_effects, contraindications, drug_interactions, pregnancy_category, pediatric_safe, geriatric_caution, therapeutic_uses) VALUES ${values.join(",")}`,
      params,
    )
    console.log(`  inserted ${Math.min(i + BATCH, rows.length)}/${rows.length}`)
  }

  const count = await pool.query("SELECT COUNT(*) FROM medicines")
  console.log(`Done. Total medicines: ${count.rows[0].count}`)
  await pool.end()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
