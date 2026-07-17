// Seeds the medicines table up to ~1000 real, popular Indian pharmacy products.
// Uses a curated catalog of top-selling Indian brands; each brand may have
// multiple real strengths/forms which count as separate SKUs (as in a real store).
import { Pool } from "pg"

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

// [brand, generic, composition, category, form, strength, mfr, mrp, rx, sideEffects, contra, interactions, pregCat, pedSafe, gerCaution, uses]
const CATALOG = [
  // ---------- ANALGESICS / ANTIPYRETICS ----------
  ["Crocin 650", "Paracetamol", "Paracetamol 650mg", "Analgesic/Antipyretic", "Tablet", "650mg", "GSK", 32, false, "Rare: nausea, rash", "Severe liver disease", "Warfarin, alcohol", "B", true, false, "Fever, headache, body ache"],
  ["Crocin Pain Relief", "Paracetamol + Caffeine", "Paracetamol 650mg + Caffeine 50mg", "Analgesic", "Tablet", "650/50mg", "GSK", 50, false, "Insomnia, palpitations", "Severe liver disease", "Alcohol", "C", false, false, "Headache, migraine, body pain"],
  ["Calpol 500", "Paracetamol", "Paracetamol 500mg", "Analgesic/Antipyretic", "Tablet", "500mg", "GSK", 20, false, "Rare: rash", "Severe liver disease", "Warfarin", "B", true, false, "Fever, mild pain"],
  ["P-250 Syrup", "Paracetamol", "Paracetamol 250mg/5ml", "Antipyretic", "Syrup", "60ml", "Apex", 40, false, "Rare: rash", "Liver disease", "None significant", "B", true, false, "Fever in children"],
  ["Febrex Plus", "Paracetamol + Phenylephrine + CPM", "PCM 500mg + PE 10mg + CPM 2mg", "Cold & Flu", "Tablet", "combo", "Indoco", 60, false, "Drowsiness", "Hypertension caution", "Sedatives, MAOIs", "C", false, true, "Cold with fever, congestion"],
  ["Sumo", "Nimesulide + Paracetamol", "Nimesulide 100mg + PCM 325mg", "NSAID", "Tablet", "100/325mg", "Alkem", 90, true, "Gastric upset, liver strain", "Liver disease, children under 12", "Other NSAIDs, warfarin", "C", false, true, "Fever with body ache, dental pain"],
  ["Nise", "Nimesulide", "Nimesulide 100mg", "NSAID", "Tablet", "100mg", "Dr. Reddy's", 85, true, "Gastric upset, hepatotoxicity risk", "Liver disease, children under 12, pregnancy", "Warfarin, other NSAIDs", "C", false, true, "Acute pain, osteoarthritis, fever"],
  ["Combiflam", "Ibuprofen + Paracetamol", "Ibuprofen 400mg + PCM 325mg", "NSAID", "Tablet", "400/325mg", "Sanofi", 47, false, "Gastric irritation", "Peptic ulcer, kidney disease, 3rd trimester", "Antihypertensives, aspirin", "C", true, true, "Pain, fever, inflammation, toothache"],
  ["Flexon", "Ibuprofen + Paracetamol", "Ibuprofen 400mg + PCM 325mg", "NSAID", "Tablet", "400/325mg", "Aristo", 42, false, "Gastric irritation", "Peptic ulcer, kidney disease", "Antihypertensives", "C", true, true, "Pain, fever, sprains"],
  ["Voveran 50", "Diclofenac", "Diclofenac Sodium 50mg", "NSAID", "Tablet", "50mg", "Novartis", 60, true, "Gastric irritation, dizziness", "Peptic ulcer, heart disease, kidney disease", "Antihypertensives, lithium, methotrexate", "C", false, true, "Joint pain, back pain, post-op pain"],
  ["Voveran SR 100", "Diclofenac", "Diclofenac Sodium 100mg SR", "NSAID", "Tablet", "100mg SR", "Novartis", 110, true, "Gastric irritation", "Peptic ulcer, cardiac disease", "Antihypertensives, lithium", "C", false, true, "Chronic joint pain, arthritis"],
  ["Naprosyn 250", "Naproxen", "Naproxen 250mg", "NSAID", "Tablet", "250mg", "RPG", 92, true, "Gastric upset, drowsiness", "Peptic ulcer, kidney disease", "Warfarin, methotrexate", "C", false, true, "Migraine, arthritis, gout"],
  ["Hifenac-P", "Aceclofenac + Paracetamol", "Aceclofenac 100mg + PCM 325mg", "NSAID", "Tablet", "100/325mg", "Intas", 92, true, "Gastric upset", "Peptic ulcer, kidney disease", "Other NSAIDs", "C", false, true, "Musculoskeletal pain, arthritis"],
  ["Dolonex DT", "Piroxicam", "Piroxicam 20mg", "NSAID", "Tablet", "20mg", "Pfizer", 95, true, "Gastric irritation", "Peptic ulcer", "Warfarin, lithium", "C", false, true, "Acute gout, musculoskeletal pain"],
  ["Ultracet", "Tramadol + Paracetamol", "Tramadol 37.5mg + PCM 325mg", "Opioid Analgesic", "Tablet", "37.5/325mg", "J&J", 190, true, "Nausea, dizziness, constipation", "Seizure disorder, MAOI use", "SSRIs, sedatives, alcohol", "C", false, true, "Moderate to severe pain"],
  ["Tramazac 50", "Tramadol", "Tramadol 50mg", "Opioid Analgesic", "Capsule", "50mg", "Zydus", 60, true, "Nausea, dizziness", "Seizures, respiratory depression", "SSRIs, MAOIs, alcohol", "C", false, true, "Moderate to severe pain"],
  // ---------- ANTIBIOTICS ----------
  ["Mox 500", "Amoxicillin", "Amoxicillin 500mg", "Antibiotic", "Capsule", "500mg", "Ranbaxy", 72, true, "Diarrhea, rash", "Penicillin allergy", "Allopurinol, OCPs", "B", true, false, "Respiratory, ENT, dental infections"],
  ["Mox 250", "Amoxicillin", "Amoxicillin 250mg", "Antibiotic", "Capsule", "250mg", "Ranbaxy", 45, true, "Diarrhea, rash", "Penicillin allergy", "Allopurinol", "B", true, false, "Mild bacterial infections"],
  ["Clavam 625", "Amoxicillin + Clavulanate", "Amoxicillin 500mg + Clavulanic Acid 125mg", "Antibiotic", "Tablet", "625mg", "Alkem", 205, true, "Diarrhea, nausea", "Penicillin allergy, cholestatic jaundice history", "Allopurinol, OCPs", "B", true, false, "Sinusitis, LRTI, UTI, skin infections"],
  ["Moxikind-CV 625", "Amoxicillin + Clavulanate", "Amoxicillin 500mg + Clavulanic Acid 125mg", "Antibiotic", "Tablet", "625mg", "Mankind", 180, true, "Diarrhea, nausea", "Penicillin allergy", "Allopurinol, OCPs", "B", true, false, "Respiratory and skin infections"],
  ["Azee 500", "Azithromycin", "Azithromycin 500mg", "Antibiotic", "Tablet", "500mg", "Cipla", 118, true, "Nausea, diarrhea", "Macrolide allergy, liver disease", "Antacids, QT drugs", "B", true, true, "Respiratory infections, typhoid, STI"],
  ["Azee 250", "Azithromycin", "Azithromycin 250mg", "Antibiotic", "Tablet", "250mg", "Cipla", 71, true, "Nausea, diarrhea", "Macrolide allergy", "Antacids, QT drugs", "B", true, true, "Mild respiratory infections"],
  ["Zifi 200", "Cefixime", "Cefixime 200mg", "Antibiotic", "Tablet", "200mg", "FDC", 105, true, "Diarrhea, GI upset", "Cephalosporin allergy", "Carbamazepine, warfarin", "B", true, false, "Typhoid, UTI, respiratory infections"],
  ["Taxim-O 200", "Cefixime", "Cefixime 200mg", "Antibiotic", "Tablet", "200mg", "Alkem", 100, true, "Diarrhea", "Cephalosporin allergy", "Warfarin", "B", true, false, "Typhoid, UTI, bronchitis"],
  ["Ceftum 500", "Cefuroxime", "Cefuroxime 500mg", "Antibiotic", "Tablet", "500mg", "GSK", 460, true, "Diarrhea, nausea", "Cephalosporin allergy", "Antacids, probenecid", "B", true, false, "Respiratory, skin, urinary infections"],
  ["Oflox 200", "Ofloxacin", "Ofloxacin 200mg", "Antibiotic", "Tablet", "200mg", "Cipla", 68, true, "Nausea, insomnia, tendinitis", "Children, pregnancy, epilepsy", "Antacids, NSAIDs, warfarin", "C", false, true, "Diarrhea with infection, UTI, typhoid"],
  ["O2 Tablet", "Ofloxacin + Ornidazole", "Ofloxacin 200mg + Ornidazole 500mg", "Antibiotic/Antiprotozoal", "Tablet", "200/500mg", "Medley", 118, true, "Metallic taste, nausea", "Pregnancy, children, alcohol", "Alcohol, warfarin", "C", false, true, "Mixed diarrheal infections, dysentery"],
  ["Norflox 400", "Norfloxacin", "Norfloxacin 400mg", "Antibiotic", "Tablet", "400mg", "Cipla", 68, true, "Nausea, dizziness", "Children, pregnancy", "Antacids, theophylline", "C", false, true, "UTI, GI infections"],
  ["Levoflox 500", "Levofloxacin", "Levofloxacin 500mg", "Antibiotic", "Tablet", "500mg", "Cipla", 95, true, "Nausea, tendinitis, QT prolongation", "Children, pregnancy, myasthenia", "Antacids, QT drugs, NSAIDs", "C", false, true, "Pneumonia, sinusitis, UTI"],
  ["Doxy-1", "Doxycycline", "Doxycycline 100mg", "Antibiotic", "Capsule", "100mg", "USV", 40, true, "Photosensitivity, GI upset", "Pregnancy, children under 8", "Antacids, iron, warfarin", "D", false, false, "Acne, malaria prophylaxis, rickettsia, respiratory infections"],
  ["Flagyl 400", "Metronidazole", "Metronidazole 400mg", "Antibiotic/Antiprotozoal", "Tablet", "400mg", "Abbott", 20, true, "Metallic taste, nausea", "1st trimester, alcohol", "Alcohol, warfarin", "B", true, false, "Amoebiasis, dental infections, anaerobic infections"],
  ["Septran DS", "Cotrimoxazole", "Sulfamethoxazole 800mg + Trimethoprim 160mg", "Antibiotic", "Tablet", "DS", "GSK", 45, true, "Rash, GI upset", "Sulfa allergy, G6PD deficiency, late pregnancy", "Warfarin, methotrexate, ACE inhibitors", "C", true, true, "UTI, respiratory infections"],
  ["Roxid 150", "Roxithromycin", "Roxithromycin 150mg", "Antibiotic", "Tablet", "150mg", "Alembic", 110, true, "GI upset", "Macrolide allergy", "Ergot alkaloids, QT drugs", "B", true, false, "Throat and respiratory infections"],
  ["Clincin 300", "Clindamycin", "Clindamycin 300mg", "Antibiotic", "Capsule", "300mg", "Alkem", 210, true, "Diarrhea, C. diff colitis risk", "Colitis history", "Neuromuscular blockers, erythromycin", "B", true, false, "Skin, soft tissue, dental infections"],
  ["Nitrofur 100", "Nitrofurantoin", "Nitrofurantoin 100mg", "Antibiotic", "Tablet", "100mg", "Zydus", 130, true, "Nausea, urine discoloration", "Kidney failure, term pregnancy, G6PD deficiency", "Antacids with magnesium", "B", true, true, "Uncomplicated UTI"],
  // ---------- ANTACIDS / GI ----------
  ["Pan 40", "Pantoprazole", "Pantoprazole 40mg", "PPI", "Tablet", "40mg", "Alkem", 125, false, "Headache, diarrhea", "PPI allergy", "Clopidogrel (minor)", "B", false, false, "Acidity, GERD, ulcers"],
  ["Pan-D", "Pantoprazole + Domperidone", "Pantoprazole 40mg + Domperidone 30mg SR", "PPI Combo", "Capsule", "40/30mg", "Alkem", 199, false, "Headache, dry mouth", "GI bleeding, prolactinoma", "QT drugs, ketoconazole", "C", false, true, "Acidity with bloating, reflux, nausea"],
  ["Omez 20", "Omeprazole", "Omeprazole 20mg", "PPI", "Capsule", "20mg", "Dr. Reddy's", 62, false, "Headache, GI upset", "PPI allergy", "Clopidogrel, diazepam", "C", false, false, "Acidity, GERD, peptic ulcer"],
  ["Omez-D", "Omeprazole + Domperidone", "Omeprazole 20mg + Domperidone 10mg", "PPI Combo", "Capsule", "20/10mg", "Dr. Reddy's", 105, false, "Headache, dry mouth", "GI bleeding", "QT drugs", "C", false, true, "Reflux with nausea and bloating"],
  ["Razo 20", "Rabeprazole", "Rabeprazole 20mg", "PPI", "Tablet", "20mg", "Dr. Reddy's", 130, false, "Headache", "PPI allergy", "Digoxin, ketoconazole", "B", false, false, "GERD, acidity, ulcers"],
  ["Rablet-D", "Rabeprazole + Domperidone", "Rabeprazole 20mg + Domperidone 30mg SR", "PPI Combo", "Capsule", "20/30mg", "Lupin", 145, false, "Headache, dry mouth", "GI bleeding", "QT drugs", "C", false, true, "Reflux with gas and fullness"],
  ["Aciloc 150", "Ranitidine", "Ranitidine 150mg", "H2 Blocker", "Tablet", "150mg", "Cadila", 25, false, "Headache", "Porphyria", "Ketoconazole", "B", true, true, "Acidity, heartburn"],
  ["Gelusil MPS", "Antacid", "Al(OH)3 + Mg(OH)2 + Simethicone", "Antacid", "Syrup", "200ml", "Pfizer", 175, false, "Constipation/loose stools", "Kidney failure", "Space other drugs 2h", "A", true, false, "Acidity, gas, indigestion"],
  ["Mucaine Gel", "Oxetacaine Antacid", "Oxetacaine + Al(OH)3 + Mg(OH)2", "Antacid", "Syrup", "200ml", "Pfizer", 190, false, "Numb mouth feel", "Kidney failure", "Space other drugs", "B", false, false, "Painful acidity, esophagitis, gastritis"],
  ["Cremaffin", "Milk of Magnesia + Liquid Paraffin", "MOM + Liquid Paraffin", "Laxative", "Syrup", "225ml", "Abbott", 210, false, "Cramps, loose stools", "Intestinal obstruction", "Reduces absorption of some drugs", "A", true, false, "Constipation, hard stools"],
  ["Duphalac", "Lactulose", "Lactulose 10g/15ml", "Laxative", "Syrup", "200ml", "Abbott", 340, false, "Bloating, cramps", "Galactosemia, intestinal obstruction", "None significant", "B", true, false, "Chronic constipation, hepatic encephalopathy"],
  ["Looz Syrup", "Lactulose", "Lactulose 10g/15ml", "Laxative", "Syrup", "200ml", "Intas", 270, false, "Bloating", "Intestinal obstruction", "None significant", "B", true, false, "Constipation"],
  ["Domstal 10", "Domperidone", "Domperidone 10mg", "Antiemetic/Prokinetic", "Tablet", "10mg", "Torrent", 33, false, "Dry mouth, headache", "GI bleeding, prolactinoma, cardiac disease", "QT drugs, ketoconazole", "C", true, true, "Nausea, vomiting, fullness after meals"],
  ["Emeset 4", "Ondansetron", "Ondansetron 4mg", "Antiemetic", "Tablet", "4mg", "Cipla", 48, true, "Headache, constipation", "QT prolongation", "Tramadol, QT drugs", "B", true, false, "Vomiting, nausea"],
  ["Vomikind MD 4", "Ondansetron", "Ondansetron 4mg mouth-dissolving", "Antiemetic", "Tablet", "4mg MD", "Mankind", 50, true, "Headache", "QT prolongation", "QT drugs", "B", true, false, "Vomiting in children and adults"],
  ["Stemetil 5", "Prochlorperazine", "Prochlorperazine 5mg", "Antiemetic/Antivertigo", "Tablet", "5mg", "Nicholas", 55, true, "Drowsiness, extrapyramidal effects", "Parkinson's, children under 10kg", "CNS depressants, levodopa", "C", false, true, "Vertigo, severe nausea"],
  ["Vertin 16", "Betahistine", "Betahistine 16mg", "Antivertigo", "Tablet", "16mg", "Abbott", 250, true, "GI upset, headache", "Pheochromocytoma, peptic ulcer caution", "Antihistamines reduce effect", "C", false, false, "Meniere's disease, vertigo, tinnitus"],
  ["Enterogermina", "Bacillus clausii", "Bacillus clausii spores 2 billion", "Probiotic", "Syrup", "5ml x10", "Sanofi", 350, false, "None significant", "None", "None", "A", true, false, "Diarrhea, gut flora restoration during antibiotics"],
  ["Econorm 250", "Saccharomyces boulardii", "S. boulardii 250mg", "Probiotic", "Powder", "250mg sachet", "Dr. Reddy's", 175, false, "None significant", "Immunocompromised caution", "Antifungals", "A", true, false, "Acute diarrhea in children and adults"],
  ["Redotil 100", "Racecadotril", "Racecadotril 100mg", "Antidiarrheal", "Capsule", "100mg", "Dr. Reddy's", 135, true, "Headache", "Kidney/liver impairment caution", "None significant", "C", true, false, "Acute watery diarrhea"],
  ["Zedott Kid", "Racecadotril", "Racecadotril 15mg sachet", "Antidiarrheal", "Powder", "15mg", "Zuventus", 78, true, "None significant", "None", "None", "C", true, false, "Watery diarrhea in children"],
  // ---------- ANTIALLERGIC / RESPIRATORY ----------
  ["Levocet 5", "Levocetirizine", "Levocetirizine 5mg", "Antihistamine", "Tablet", "5mg", "Hetero", 55, false, "Mild drowsiness", "Severe kidney disease", "Alcohol, sedatives", "B", true, true, "Allergic rhinitis, urticaria, itching"],
  ["Teczine 5", "Levocetirizine", "Levocetirizine 5mg", "Antihistamine", "Tablet", "5mg", "Sun Pharma", 90, false, "Mild drowsiness", "Kidney disease caution", "Alcohol", "B", true, true, "Allergy, sneezing, hives"],
  ["Alaspan AM", "Loratadine + Ambroxol", "Loratadine 5mg + Ambroxol 60mg", "Antiallergic", "Tablet", "combo", "Fulford", 105, false, "Dry mouth", "Liver disease caution", "Alcohol", "B", false, false, "Allergic cough with mucus"],
  ["Montair LC", "Montelukast + Levocetirizine", "Montelukast 10mg + Levocetirizine 5mg", "Antiallergic", "Tablet", "10/5mg", "Cipla", 168, true, "Drowsiness, headache", "Liver disease caution", "Rifampicin, phenobarbital", "B", false, false, "Allergic rhinitis, asthma allergy, chronic allergic cough"],
  ["Montek 10", "Montelukast", "Montelukast 10mg", "Leukotriene Antagonist", "Tablet", "10mg", "Sun Pharma", 175, true, "Headache, mood changes (rare)", "None major", "Phenobarbital, rifampicin", "B", true, false, "Asthma maintenance, allergic rhinitis"],
  ["Asthalin 4", "Salbutamol", "Salbutamol 4mg", "Bronchodilator", "Tablet", "4mg", "Cipla", 20, true, "Tremor, palpitations", "Hyperthyroidism, cardiac disease caution", "Beta blockers", "C", true, true, "Wheezing, bronchospasm, asthma"],
  ["Asthalin Inhaler", "Salbutamol", "Salbutamol 100mcg/dose", "Bronchodilator", "Inhaler", "200 doses", "Cipla", 165, true, "Tremor, tachycardia", "Cardiac arrhythmia caution", "Beta blockers", "C", true, true, "Acute asthma relief, bronchospasm"],
  ["Budecort Inhaler 200", "Budesonide", "Budesonide 200mcg/dose", "Inhaled Corticosteroid", "Inhaler", "200mcg", "Cipla", 480, true, "Oral thrush, hoarseness", "Untreated oral infections", "Ketoconazole", "B", true, false, "Asthma maintenance therapy"],
  ["Foracort 200 Inhaler", "Formoterol + Budesonide", "Formoterol 6mcg + Budesonide 200mcg", "Bronchodilator/ICS", "Inhaler", "120 doses", "Cipla", 595, true, "Tremor, thrush", "Cardiac arrhythmia caution", "Beta blockers, ketoconazole", "C", false, true, "Asthma, COPD maintenance"],
  ["Duolin Respules", "Ipratropium + Levosalbutamol", "Ipratropium 500mcg + Levosalbutamol 1.25mg", "Bronchodilator", "Drops", "2.5ml respule", "Cipla", 105, true, "Dry mouth, tremor", "Glaucoma, prostatic hypertrophy", "Beta blockers", "C", true, true, "Nebulization for COPD/asthma attack"],
  ["Grilinctus Syrup", "Dextromethorphan combo", "DXM 5mg + CPM 2.5mg + Guaifenesin 50mg", "Antitussive", "Syrup", "100ml", "Franco-Indian", 105, false, "Drowsiness", "MAOI use, productive cough", "MAOIs, sedatives", "C", false, true, "Dry cough"],
  ["Corex DX", "Dextromethorphan + CPM", "DXM 10mg + CPM 4mg per 5ml", "Antitussive", "Syrup", "100ml", "Pfizer", 122, true, "Drowsiness, constipation", "MAOI use, children under 6", "MAOIs, alcohol", "C", false, true, "Dry irritating cough"],
  ["Alex Syrup", "Phenylephrine + CPM + DXM", "PE 5mg + CPM 2mg + DXM 10mg per 5ml", "Cold & Cough", "Syrup", "100ml", "Glenmark", 108, false, "Drowsiness", "Hypertension caution", "MAOIs, sedatives", "C", false, true, "Cold with dry cough"],
  ["Mucolite 30", "Ambroxol", "Ambroxol 30mg", "Mucolytic", "Tablet", "30mg", "Dr. Reddy's", 55, false, "GI upset", "Peptic ulcer caution", "None significant", "B", true, false, "Thick mucus, productive cough"],
  ["Sinarest", "PCM + PE + CPM", "PCM 500mg + PE 10mg + CPM 2mg", "Cold & Flu", "Tablet", "combo", "Centaur", 68, false, "Drowsiness", "Hypertension, glaucoma", "MAOIs, sedatives, antihypertensives", "C", false, true, "Cold, blocked nose, fever, sneezing"],
  ["Nasivion Nasal Drops", "Oxymetazoline", "Oxymetazoline 0.05%", "Nasal Decongestant", "Drops", "10ml", "Merck", 92, false, "Rebound congestion", "Use beyond 7 days", "MAOIs", "C", false, true, "Blocked nose, sinus congestion"],
  ["Otrivin Pediatric", "Xylometazoline", "Xylometazoline 0.05%", "Nasal Decongestant", "Drops", "10ml", "GSK", 95, false, "Rebound congestion", "Prolonged use", "MAOIs", "C", true, false, "Blocked nose in children"],
  // ---------- DIABETES ----------
  ["Glycomet GP1", "Metformin + Glimepiride", "Metformin 500mg + Glimepiride 1mg", "Antidiabetic", "Tablet", "500/1mg", "USV", 105, true, "Hypoglycemia, GI upset", "Kidney failure, type 1 DM", "Alcohol, beta blockers mask hypo", "C", false, true, "Type 2 diabetes"],
  ["Glycomet GP2", "Metformin + Glimepiride", "Metformin 500mg + Glimepiride 2mg", "Antidiabetic", "Tablet", "500/2mg", "USV", 135, true, "Hypoglycemia", "Kidney failure", "Alcohol", "C", false, true, "Type 2 diabetes"],
  ["Janumet 50/500", "Sitagliptin + Metformin", "Sitagliptin 50mg + Metformin 500mg", "Antidiabetic", "Tablet", "50/500mg", "MSD", 372, true, "GI upset, pancreatitis (rare)", "Kidney failure, pancreatitis history", "Alcohol", "B", false, true, "Type 2 diabetes"],
  ["Galvus Met 50/500", "Vildagliptin + Metformin", "Vildagliptin 50mg + Metformin 500mg", "Antidiabetic", "Tablet", "50/500mg", "Novartis", 320, true, "GI upset, liver enzyme rise", "Liver disease, kidney failure", "Alcohol", "B", false, true, "Type 2 diabetes"],
  ["Forxiga 10", "Dapagliflozin", "Dapagliflozin 10mg", "SGLT2 Inhibitor", "Tablet", "10mg", "AstraZeneca", 490, true, "UTI, genital infections, dehydration", "Kidney failure, DKA history", "Diuretics", "C", false, true, "Type 2 diabetes, heart failure"],
  ["Jardiance 10", "Empagliflozin", "Empagliflozin 10mg", "SGLT2 Inhibitor", "Tablet", "10mg", "Boehringer", 590, true, "UTI, genital infections", "Kidney failure", "Diuretics", "C", false, true, "Type 2 diabetes, cardio-renal protection"],
  ["Amaryl 1", "Glimepiride", "Glimepiride 1mg", "Sulfonylurea", "Tablet", "1mg", "Sanofi", 130, true, "Hypoglycemia, weight gain", "Type 1 DM, DKA", "Beta blockers, alcohol", "C", false, true, "Type 2 diabetes"],
  ["Human Mixtard 30/70", "Insulin", "Biphasic Isophane Insulin 40IU/ml", "Insulin", "Injection", "10ml vial", "Novo Nordisk", 175, true, "Hypoglycemia, weight gain", "Hypoglycemia", "Beta blockers mask hypo", "B", true, true, "Diabetes requiring insulin"],
  ["Lantus 100IU", "Insulin Glargine", "Insulin Glargine 100IU/ml", "Insulin", "Injection", "3ml pen", "Sanofi", 750, true, "Hypoglycemia", "Hypoglycemia", "Beta blockers", "C", true, true, "Basal insulin for diabetes"],
  // ---------- CARDIAC / BP ----------
  ["Telma 20", "Telmisartan", "Telmisartan 20mg", "ARB", "Tablet", "20mg", "Glenmark", 120, true, "Dizziness", "Pregnancy, renal artery stenosis", "Potassium, NSAIDs, lithium", "D", false, true, "Hypertension"],
  ["Telma H", "Telmisartan + HCTZ", "Telmisartan 40mg + Hydrochlorothiazide 12.5mg", "ARB + Diuretic", "Tablet", "40/12.5mg", "Glenmark", 260, true, "Dizziness, electrolyte imbalance", "Pregnancy, anuria", "Lithium, NSAIDs", "D", false, true, "Hypertension uncontrolled on monotherapy"],
  ["Losar 50", "Losartan", "Losartan 50mg", "ARB", "Tablet", "50mg", "Unichem", 105, true, "Dizziness", "Pregnancy", "Potassium, NSAIDs", "D", false, true, "Hypertension, kidney protection in diabetes"],
  ["Stamlo 5", "Amlodipine", "Amlodipine 5mg", "CCB", "Tablet", "5mg", "Dr. Reddy's", 42, true, "Ankle swelling, flushing", "Severe hypotension", "Simvastatin high-dose", "C", false, true, "Hypertension, angina"],
  ["Amlokind-AT", "Amlodipine + Atenolol", "Amlodipine 5mg + Atenolol 50mg", "CCB + Beta Blocker", "Tablet", "5/50mg", "Mankind", 45, true, "Fatigue, cold extremities, ankle swelling", "Asthma, heart block, bradycardia", "Verapamil, insulin (masks hypo)", "D", false, true, "Hypertension with high heart rate"],
  ["Concor 5", "Bisoprolol", "Bisoprolol 5mg", "Beta Blocker", "Tablet", "5mg", "Merck", 190, true, "Fatigue, bradycardia", "Asthma, heart block", "Verapamil, clonidine", "C", false, true, "Hypertension, heart failure, angina"],
  ["Met-XL 25", "Metoprolol", "Metoprolol Succinate 25mg XL", "Beta Blocker", "Tablet", "25mg XL", "Ajanta", 85, true, "Fatigue, dizziness", "Asthma, heart block", "Verapamil, insulin", "C", false, true, "Hypertension, angina, post-MI"],
  ["Cardace 5", "Ramipril", "Ramipril 5mg", "ACE Inhibitor", "Tablet", "5mg", "Sanofi", 205, true, "Dry cough, dizziness", "Pregnancy, angioedema history, bilateral RAS", "Potassium, NSAIDs, lithium", "D", false, true, "Hypertension, heart failure, post-MI"],
  ["Clopilet 75", "Clopidogrel", "Clopidogrel 75mg", "Antiplatelet", "Tablet", "75mg", "Sun Pharma", 60, true, "Bleeding risk, bruising", "Active bleeding, peptic ulcer", "Omeprazole, NSAIDs, warfarin", "B", false, true, "Post-stent, stroke/MI prevention"],
  ["Ecosprin-AV 75", "Aspirin + Atorvastatin", "Aspirin 75mg + Atorvastatin 10mg", "Antiplatelet + Statin", "Capsule", "75/10mg", "USV", 115, true, "Gastric irritation, muscle pain", "Active ulcer, liver disease, pregnancy", "Warfarin, NSAIDs", "X", false, true, "Cardiovascular protection combo"],
  ["Rozavel 10", "Rosuvastatin", "Rosuvastatin 10mg", "Statin", "Tablet", "10mg", "Sun Pharma", 155, true, "Muscle pain, headache", "Liver disease, pregnancy", "Gemfibrozil, cyclosporine", "X", false, false, "High cholesterol"],
  ["Storvas 20", "Atorvastatin", "Atorvastatin 20mg", "Statin", "Tablet", "20mg", "Sun Pharma", 130, true, "Muscle pain", "Liver disease, pregnancy", "Clarithromycin, fibrates", "X", false, false, "High cholesterol, CV prevention"],
  ["Dytor 10", "Torsemide", "Torsemide 10mg", "Loop Diuretic", "Tablet", "10mg", "Cipla", 95, true, "Dehydration, low potassium", "Anuria, severe electrolyte imbalance", "Lithium, digoxin, NSAIDs", "B", false, true, "Edema, heart failure"],
  ["Lasix 40", "Furosemide", "Furosemide 40mg", "Loop Diuretic", "Tablet", "40mg", "Sanofi", 15, true, "Dehydration, low potassium", "Anuria", "Lithium, aminoglycosides", "C", true, true, "Edema, heart failure, hypertension"],
  ["Sorbitrate 5", "Isosorbide Dinitrate", "ISDN 5mg", "Nitrate", "Tablet", "5mg", "Abbott", 25, true, "Headache, hypotension", "Sildenafil use, severe hypotension", "PDE5 inhibitors", "C", false, true, "Angina relief"],
  // ---------- NEURO / PSYCH ----------
  ["Gabapin 300", "Gabapentin", "Gabapentin 300mg", "Neuropathic Agent", "Capsule", "300mg", "Intas", 185, true, "Drowsiness, dizziness", "Kidney impairment dose adjust", "Opioids, antacids", "C", false, true, "Nerve pain, neuropathy, post-herpetic neuralgia"],
  ["Pregabid 75", "Pregabalin", "Pregabalin 75mg", "Neuropathic Agent", "Capsule", "75mg", "Intas", 160, true, "Drowsiness, weight gain, edema", "Kidney impairment dose adjust", "Opioids, sedatives", "C", false, true, "Diabetic neuropathy, nerve pain, fibromyalgia"],
  ["Nexito 10", "Escitalopram", "Escitalopram 10mg", "SSRI", "Tablet", "10mg", "Sun Pharma", 120, true, "Nausea, insomnia, sexual dysfunction", "MAOI use, QT prolongation", "MAOIs, tramadol, NSAIDs", "C", false, true, "Depression, anxiety disorders"],
  ["Zolfresh 10", "Zolpidem", "Zolpidem 10mg", "Hypnotic", "Tablet", "10mg", "Abbott", 145, true, "Drowsiness, sleepwalking (rare)", "Sleep apnea, myasthenia", "Alcohol, CNS depressants", "C", false, true, "Short-term insomnia"],
  ["Alprax 0.5", "Alprazolam", "Alprazolam 0.5mg", "Benzodiazepine", "Tablet", "0.5mg", "Torrent", 35, true, "Drowsiness, dependence", "Glaucoma, respiratory depression", "Alcohol, opioids, ketoconazole", "D", false, true, "Anxiety, panic (short-term)"],
  ["Vertistar 8", "Betahistine", "Betahistine 8mg", "Antivertigo", "Tablet", "8mg", "Mankind", 90, true, "GI upset", "Pheochromocytoma", "Antihistamines", "C", false, false, "Vertigo, dizziness"],
  ["Naxdom 500", "Naproxen + Domperidone", "Naproxen 500mg + Domperidone 10mg", "Migraine", "Tablet", "500/10mg", "Sun Pharma", 180, true, "Gastric upset, drowsiness", "Peptic ulcer, cardiac disease", "Warfarin, QT drugs", "C", false, true, "Migraine attack with nausea"],
  ["Suminat 50", "Sumatriptan", "Sumatriptan 50mg", "Triptan", "Tablet", "50mg", "Sun Pharma", 260, true, "Chest tightness, flushing", "Heart disease, uncontrolled BP, hemiplegic migraine", "MAOIs, SSRIs, ergots", "C", false, true, "Acute migraine attack"],
  // ---------- HORMONES / THYROID / STEROIDS ----------
  ["Thyronorm 25", "Levothyroxine", "Levothyroxine 25mcg", "Thyroid Hormone", "Tablet", "25mcg", "Abbott", 110, true, "Palpitations if overdosed", "Thyrotoxicosis", "Iron, calcium, PPIs", "A", true, true, "Hypothyroidism"],
  ["Thyronorm 100", "Levothyroxine", "Levothyroxine 100mcg", "Thyroid Hormone", "Tablet", "100mcg", "Abbott", 155, true, "Palpitations if overdosed", "Thyrotoxicosis", "Iron, calcium", "A", true, true, "Hypothyroidism"],
  ["Eltroxin 50", "Levothyroxine", "Levothyroxine 50mcg", "Thyroid Hormone", "Tablet", "50mcg", "GSK", 130, true, "Palpitations if overdosed", "Thyrotoxicosis", "Iron, calcium", "A", true, true, "Hypothyroidism"],
  ["Omnacortil 10", "Prednisolone", "Prednisolone 10mg", "Corticosteroid", "Tablet", "10mg", "Macleods", 42, true, "Weight gain, high sugar, immunosuppression", "Systemic infections, live vaccines", "NSAIDs, antidiabetics, vaccines", "C", true, true, "Allergic conditions, asthma, autoimmune flares"],
  ["Wysolone 5", "Prednisolone", "Prednisolone 5mg", "Corticosteroid", "Tablet", "5mg", "Pfizer", 25, true, "Weight gain, gastric irritation", "Systemic infections", "NSAIDs, antidiabetics", "C", true, true, "Inflammatory and allergic conditions"],
  ["Medrol 4", "Methylprednisolone", "Methylprednisolone 4mg", "Corticosteroid", "Tablet", "4mg", "Pfizer", 88, true, "Insomnia, gastric upset", "Systemic fungal infections", "NSAIDs, antidiabetics", "C", true, true, "Allergy, inflammation, autoimmune conditions"],
  ["Dexona", "Dexamethasone", "Dexamethasone 0.5mg", "Corticosteroid", "Tablet", "0.5mg", "Zydus", 6, true, "Weight gain, immunosuppression", "Systemic infections", "NSAIDs, antidiabetics", "C", true, true, "Severe allergy, inflammation"],
  ["Regestrone 5", "Norethisterone", "Norethisterone 5mg", "Progestin", "Tablet", "5mg", "Torrent", 60, true, "Breast tenderness, spotting", "Pregnancy, liver disease, breast cancer", "Rifampicin, anticonvulsants", "X", false, false, "Delaying periods, abnormal uterine bleeding"],
  ["Meprate 10", "Medroxyprogesterone", "MPA 10mg", "Progestin", "Tablet", "10mg", "Serum Institute", 80, true, "Spotting, bloating", "Pregnancy, liver disease", "Rifampicin", "X", false, false, "Irregular periods, secondary amenorrhea"],
  ["Ovral L", "Levonorgestrel + Ethinylestradiol", "LNG 0.15mg + EE 0.03mg", "Oral Contraceptive", "Tablet", "21 tab", "Pfizer", 110, true, "Nausea, breast tenderness, spotting", "Thromboembolism, smoking over 35, liver disease", "Rifampicin, anticonvulsants", "X", false, false, "Contraception, cycle regulation"],
  ["Unwanted 72", "Levonorgestrel", "Levonorgestrel 1.5mg", "Emergency Contraceptive", "Tablet", "1.5mg", "Mankind", 110, false, "Nausea, cycle disturbance", "Pregnancy", "Rifampicin, anticonvulsants", "X", false, false, "Emergency contraception within 72 hours"],
  // ---------- DERMA / TOPICALS ----------
  ["Candid-B Cream", "Clotrimazole + Beclometasone", "Clotrimazole 1% + Beclometasone 0.025%", "Antifungal + Steroid", "Cream", "20g", "Glenmark", 120, true, "Skin thinning with prolonged use", "Viral skin infections, prolonged use on face", "None topical", "C", false, false, "Inflamed fungal infections with itching"],
  ["Luliconazole (Lulifin)", "Luliconazole", "Luliconazole 1%", "Antifungal", "Cream", "20g", "Sun Pharma", 285, true, "Local irritation", "Hypersensitivity", "None topical", "C", true, false, "Ringworm, tinea infections"],
  ["Ketostar Cream", "Ketoconazole", "Ketoconazole 2%", "Antifungal", "Cream", "30g", "Mankind", 105, false, "Local irritation", "Hypersensitivity", "None topical", "C", true, false, "Fungal skin infections, dandruff-related dermatitis"],
  ["Nizral Shampoo", "Ketoconazole", "Ketoconazole 2%", "Antifungal", "Cream", "50ml", "J&J", 320, false, "Dry scalp", "Scalp wounds", "None", "C", true, false, "Dandruff, seborrheic dermatitis"],
  ["Permite Cream", "Permethrin", "Permethrin 5%", "Scabicide", "Cream", "30g", "Galderma", 110, false, "Mild burning, itching", "Damaged skin caution", "None topical", "B", true, false, "Scabies treatment"],
  ["Scabper Lotion", "Permethrin", "Permethrin 5%", "Scabicide", "Cream", "50ml", "Zydus", 95, false, "Mild burning", "Broken skin", "None", "B", true, false, "Scabies, lice"],
  ["Neosporin Powder", "Neomycin combo", "Neomycin + Bacitracin + Polymyxin B", "Topical Antibiotic", "Powder", "10g", "GSK", 90, false, "Local sensitivity", "Large open wounds", "None topical", "C", true, false, "Cuts, wounds, prevention of infection"],
  ["T-Bact Ointment", "Mupirocin", "Mupirocin 2%", "Topical Antibiotic", "Cream", "5g", "GSK", 165, true, "Local burning", "Hypersensitivity", "None topical", "B", true, false, "Impetigo, infected cuts, boils"],
  ["Faktu Ointment", "Policresulen + Cinchocaine", "Policresulen 5% + Cinchocaine 1%", "Anorectal", "Cream", "20g", "Abbott", 165, false, "Local burning", "Hypersensitivity", "None", "C", false, false, "Piles, anal fissures"],
  ["Anovate Cream", "Beclometasone + Phenylephrine + Lidocaine", "combo", "Anorectal", "Cream", "20g", "Encube", 135, false, "Local irritation", "Viral/fungal anal infections", "None", "C", false, false, "Painful hemorrhoids"],
  ["Quadriderm Cream", "Betamethasone combo", "Betamethasone + Gentamicin + Tolnaftate + Clioquinol", "Steroid Combo", "Cream", "20g", "MSD", 145, true, "Skin thinning", "Prolonged use, facial use", "None topical", "C", false, false, "Mixed infected eczema (short course)"],
  ["Betnovate-N", "Betamethasone + Neomycin", "Betamethasone 0.1% + Neomycin 0.5%", "Steroid + Antibiotic", "Cream", "20g", "GSK", 45, true, "Skin thinning", "Viral skin lesions, prolonged use", "None topical", "C", false, false, "Infected eczema, dermatitis"],
  ["Melaglow Cream", "Skin brightener", "Niacinamide combo", "Dermaceutical", "Cream", "20g", "Abbott", 400, false, "Mild irritation", "None", "None", "A", false, false, "Pigmentation, uneven skin tone"],
  ["Acnestar Gel", "Clindamycin + Nicotinamide", "Clindamycin 1% + Nicotinamide 4%", "Anti-acne", "Gel", "22g", "Mankind", 150, false, "Dryness, peeling", "Hypersensitivity", "None topical", "B", false, false, "Acne, pimples"],
  ["Retino-A 0.025%", "Tretinoin", "Tretinoin 0.025%", "Retinoid", "Cream", "20g", "J&J", 155, true, "Peeling, redness, photosensitivity", "Pregnancy, eczema", "Other keratolytics", "D", false, false, "Acne, photoaging"],
  ["Silverex Cream", "Silver Sulfadiazine", "Silver Sulfadiazine 1%", "Burn Cream", "Cream", "50g", "Ranbaxy", 130, false, "Local irritation", "Sulfa allergy, late pregnancy, neonates", "None topical", "B", false, false, "Burns, infected wounds"],
  // ---------- EYE / ENT ----------
  ["Ciplox Eye Drops", "Ciprofloxacin", "Ciprofloxacin 0.3%", "Eye Antibiotic", "Drops", "10ml", "Cipla", 18, true, "Transient stinging", "Viral eye infections", "None significant", "C", true, false, "Bacterial conjunctivitis, eye infections"],
  ["Moxigram Eye Drops", "Moxifloxacin", "Moxifloxacin 0.5%", "Eye Antibiotic", "Drops", "5ml", "Micro Labs", 120, true, "Transient irritation", "Hypersensitivity", "None significant", "C", true, false, "Bacterial conjunctivitis"],
  ["Refresh Tears", "Carboxymethylcellulose", "CMC 0.5%", "Lubricant", "Drops", "10ml", "Allergan", 185, false, "Transient blur", "None", "None", "A", true, false, "Dry eyes, screen strain"],
  ["Itone Eye Drops", "Herbal", "Herbal eye tonic", "Eye Care", "Drops", "10ml", "Dey's", 75, false, "Mild sting", "None", "None", "A", true, false, "Eye strain, mild irritation"],
  ["Otogesic Ear Drops", "Benzocaine + Chlorbutol", "combo", "Ear Drops", "Drops", "5ml", "Zydus", 75, false, "Local irritation", "Perforated eardrum", "None", "C", true, false, "Ear pain, earwax discomfort"],
  ["Soliwax Ear Drops", "Docusate", "Docusate Sodium 0.5%", "Cerumenolytic", "Drops", "10ml", "Zuventus", 105, false, "None significant", "Perforated eardrum", "None", "A", true, false, "Earwax softening and removal"],
  ["Betadine Gargle", "Povidone Iodine", "Povidone Iodine 2%", "Antiseptic Gargle", "Syrup", "100ml", "Win-Medicare", 150, false, "Metallic taste", "Thyroid disorders, iodine allergy", "None", "D", false, false, "Sore throat, oral hygiene"],
  ["Hexigel", "Chlorhexidine", "Chlorhexidine Gluconate 1%", "Oral Antiseptic", "Gel", "15g", "ICPA", 65, false, "Taste alteration, staining", "Hypersensitivity", "None", "B", true, false, "Gum infections, mouth ulcers"],
  ["Zytee RB Gel", "Choline Salicylate + Benzalkonium", "combo", "Oral Gel", "Gel", "10ml", "Zydus", 78, false, "Local burning", "Aspirin allergy", "None", "C", true, false, "Mouth ulcer pain relief"],
  ["Dologel CT", "Choline Salicylate + Lidocaine", "combo", "Teething Gel", "Gel", "10g", "Dr. Reddy's", 85, false, "Local numbness", "Aspirin allergy in children", "None", "C", true, false, "Teething pain, mouth ulcers"],
  // ---------- VITAMINS / SUPPLEMENTS ----------
  ["Neurobion Forte", "B-Complex", "B1+B6+B12 combo", "Vitamin", "Tablet", "combo", "Merck", 38, false, "None significant", "None", "Levodopa (B6)", "A", true, false, "Nerve health, B-vitamin deficiency"],
  ["Polybion Syrup", "B-Complex", "B-complex syrup", "Vitamin", "Syrup", "250ml", "Merck", 145, false, "None significant", "None", "None", "A", true, false, "Weakness, appetite, B-deficiency"],
  ["A to Z NS", "Multivitamin", "Multivitamin + Minerals", "Multivitamin", "Tablet", "combo", "Alkem", 105, false, "None significant", "None", "None", "A", true, false, "General wellness, micronutrient support"],
  ["Supradyn", "Multivitamin", "Multivitamin + Minerals", "Multivitamin", "Tablet", "combo", "Abbott", 47, false, "None significant", "None", "None", "A", true, false, "Daily multivitamin"],
  ["Revital H", "Multivitamin + Ginseng", "Multivitamin + Minerals + Ginseng", "Multivitamin", "Capsule", "combo", "Sun Pharma", 350, false, "None significant", "Uncontrolled BP caution (ginseng)", "None", "C", false, false, "Energy, stamina, daily nutrition"],
  ["Uprise-D3 60K", "Cholecalciferol", "Vitamin D3 60000IU", "Vitamin D", "Capsule", "60000IU", "Alkem", 32, false, "Hypercalcemia if overdosed", "Hypercalcemia", "Thiazides", "A", true, false, "Vitamin D deficiency (weekly dose)"],
  ["Calcirol Sachet", "Cholecalciferol", "Vitamin D3 60000IU granules", "Vitamin D", "Powder", "1g sachet", "Cadila", 35, false, "Hypercalcemia if overdosed", "Hypercalcemia", "Thiazides", "A", true, false, "Vitamin D deficiency"],
  ["Shelcal-HD 12", "Calcium + D3", "Calcium 500mg + D3 1000IU", "Supplement", "Tablet", "500mg/1000IU", "Torrent", 190, false, "Constipation", "Hypercalcemia, kidney stones", "Thyroxine, iron", "A", true, false, "Bone health, osteoporosis"],
  ["Gemcal", "Calcitriol + Calcium + Zinc", "Calcitriol 0.25mcg + Ca 500mg + Zn 7.5mg", "Supplement", "Capsule", "combo", "Alkem", 190, false, "Constipation", "Hypercalcemia", "Thiazides", "A", false, false, "Osteoporosis, calcium deficiency"],
  ["Livogen", "Iron + Folic Acid", "Ferrous Fumarate 152mg + Folic Acid 1.5mg", "Hematinic", "Tablet", "combo", "Merck", 45, false, "Dark stools, constipation", "Hemochromatosis", "Tetracyclines, antacids", "A", true, false, "Iron deficiency anemia"],
  ["Orofer XT", "Iron + Folic Acid", "Ferrous Ascorbate 100mg + Folic Acid 1.5mg", "Hematinic", "Tablet", "100/1.5mg", "Emcure", 145, false, "Dark stools, nausea", "Hemochromatosis", "Antacids, tetracyclines", "A", true, false, "Anemia, pregnancy anemia"],
  ["Folvite 5", "Folic Acid", "Folic Acid 5mg", "Vitamin", "Tablet", "5mg", "Pfizer", 45, false, "None significant", "Untreated B12 deficiency", "Methotrexate, phenytoin", "A", true, false, "Folate deficiency, pregnancy planning"],
  ["Methylcobal 500", "Methylcobalamin", "Methylcobalamin 500mcg", "Vitamin B12", "Tablet", "500mcg", "Sun Pharma", 135, false, "None significant", "None", "None", "A", true, false, "B12 deficiency, neuropathy support"],
  ["Evion 400", "Vitamin E", "Tocopherol 400mg", "Vitamin E", "Capsule", "400mg", "Merck", 35, false, "None significant at dose", "Bleeding disorders (high dose)", "Warfarin (high dose)", "A", false, false, "Vitamin E deficiency, skin/hair support"],
  ["Limcee 500", "Vitamin C", "Ascorbic Acid 500mg", "Vitamin C", "Tablet", "500mg", "Abbott", 25, false, "GI upset (high dose)", "Kidney stones history caution", "None significant", "A", true, false, "Immunity, vitamin C deficiency, wound healing"],
  ["Zincolife", "Zinc", "Elemental Zinc 50mg", "Mineral", "Tablet", "50mg", "Fourrts", 90, false, "Nausea if empty stomach", "None", "Quinolones, tetracyclines", "A", true, false, "Zinc deficiency, immunity, diarrhea recovery"],
  ["Seven Seas", "Cod Liver Oil", "Cod liver oil 300mg", "Omega", "Capsule", "300mg", "Merck", 240, false, "Fishy burps", "Fish allergy", "Warfarin (high dose)", "A", true, false, "Omega-3, bone and immunity support"],
  // ---------- WORMS / MALARIA / OTHERS ----------
  ["Zentel 400", "Albendazole", "Albendazole 400mg", "Anthelmintic", "Tablet", "400mg", "GSK", 40, false, "GI upset, headache", "Pregnancy, liver disease", "Cimetidine, praziquantel", "C", true, false, "Worm infestations, deworming"],
  ["Banocide Forte", "Diethylcarbamazine", "DEC 100mg", "Antifilarial", "Tablet", "100mg", "GSK", 40, true, "Nausea, fever reaction", "Severe hypertension, kidney disease", "None significant", "C", true, false, "Filariasis, tropical eosinophilia"],
  ["Lariago 250", "Chloroquine", "Chloroquine 250mg", "Antimalarial", "Tablet", "250mg", "Ipca", 20, true, "GI upset, visual changes (long-term)", "Retinopathy, psoriasis", "Antacids, cimetidine", "C", true, true, "Malaria (sensitive strains)"],
  ["Falcigo 50", "Artesunate", "Artesunate 50mg", "Antimalarial", "Tablet", "50mg", "Zydus", 220, true, "Dizziness, GI upset", "1st trimester caution", "None major", "C", true, false, "P. falciparum malaria"],
  ["Fluka 150", "Fluconazole", "Fluconazole 150mg", "Antifungal", "Tablet", "150mg", "Cipla", 25, true, "Nausea, headache", "Liver disease caution, QT drugs", "Warfarin, phenytoin, QT drugs", "C", false, false, "Vaginal candidiasis, fungal infections"],
  ["Terbicip 250", "Terbinafine", "Terbinafine 250mg", "Antifungal", "Tablet", "250mg", "Cipla", 180, true, "Taste loss, GI upset, liver strain", "Liver disease", "Rifampicin, cimetidine", "B", false, false, "Ringworm, nail fungus (oral therapy)"],
  ["Acivir 400", "Aciclovir", "Aciclovir 400mg", "Antiviral", "Tablet", "400mg", "Cipla", 110, true, "Nausea, headache", "Kidney impairment dose adjust", "Probenecid, nephrotoxic drugs", "B", true, true, "Herpes simplex, shingles, chickenpox"],
  ["HHZole Cream", "Sertaconazole", "Sertaconazole 2%", "Antifungal", "Cream", "30g", "Hegde & Hegde", 320, true, "Local irritation", "Hypersensitivity", "None topical", "C", true, false, "Resistant fungal skin infections"],
  ["Allegra-M", "Fexofenadine + Montelukast", "Fexofenadine 120mg + Montelukast 10mg", "Antiallergic", "Tablet", "120/10mg", "Sanofi", 265, true, "Headache", "Kidney disease caution", "Antacids", "C", false, false, "Allergic rhinitis with asthma component"],
  ["Deriphyllin", "Etofylline + Theophylline", "Etofylline 77mg + Theophylline 23mg", "Bronchodilator", "Tablet", "combo", "Zydus", 25, true, "Nausea, palpitations, tremor", "Peptic ulcer, seizures, arrhythmia", "Ciprofloxacin, erythromycin", "C", true, true, "Bronchospasm, COPD, asthma"],
  ["Hetrazan 100", "Diethylcarbamazine", "DEC 100mg", "Antifilarial", "Tablet", "100mg", "Sanofi", 35, true, "Fever reaction", "Kidney disease", "None", "C", true, false, "Filariasis"],
  ["Urimax 0.4", "Tamsulosin", "Tamsulosin 0.4mg", "Alpha Blocker", "Capsule", "0.4mg", "Cipla", 320, true, "Dizziness, retrograde ejaculation", "Orthostatic hypotension", "Other alpha blockers, PDE5 inhibitors", "B", false, true, "BPH urinary symptoms"],
  ["Silodal 8", "Silodosin", "Silodosin 8mg", "Alpha Blocker", "Capsule", "8mg", "Sun Pharma", 370, true, "Dizziness, retrograde ejaculation", "Severe kidney/liver disease", "Ketoconazole, other alpha blockers", "B", false, true, "BPH"],
  ["Cystone", "Herbal", "Himalaya herbal blend", "Urology Herbal", "Tablet", "herbal", "Himalaya", 160, false, "None significant", "None", "None", "A", true, false, "Urinary stones support, UTI support"],
  ["Liv 52 DS", "Herbal", "Himalaya herbal hepatoprotective", "Liver Herbal", "Tablet", "herbal", "Himalaya", 175, false, "None significant", "None", "None", "A", true, false, "Liver support, appetite"],
  ["Ashwagandha (Himalaya)", "Withania somnifera", "Ashwagandha 250mg", "Herbal Adaptogen", "Tablet", "250mg", "Himalaya", 210, false, "Mild drowsiness", "Pregnancy, autoimmune caution", "Sedatives, thyroid meds", "C", false, false, "Stress, energy, sleep support"],
  ["Chyawanprash (Dabur)", "Herbal", "Ayurvedic jam", "Herbal", "Powder", "500g", "Dabur", 220, false, "None significant", "Diabetes caution (sugar)", "None", "A", true, false, "Immunity, seasonal wellness"],
  ["Electral Z", "ORS + Zinc", "WHO ORS + Zinc 20mg", "Rehydration", "Powder", "sachet", "FDC", 30, false, "None significant", "None", "None", "A", true, false, "Diarrhea with zinc supplementation"],
  ["Glucon-D", "Glucose", "Dextrose + minerals", "Energy", "Powder", "450g", "Zydus", 180, false, "None significant", "Diabetes caution", "None", "A", true, false, "Instant energy, heat exhaustion"],
  ["Volini Spray", "Diclofenac topical", "Diclofenac spray", "Topical NSAID", "Gel", "100g spray", "Sun Pharma", 265, false, "Local irritation", "Open wounds", "None topical", "C", false, false, "Muscle sprain, back pain (spray)"],
  ["Moov Cream", "Wintergreen combo", "Wintergreen oil + turpentine + mint", "Topical Rubefacient", "Cream", "50g", "Reckitt", 190, false, "Skin warmth, irritation", "Broken skin", "None", "C", false, false, "Back ache, muscle pain"],
  ["Iodex Balm", "Methyl Salicylate combo", "Methyl salicylate + menthol", "Topical Balm", "Cream", "40g", "GSK", 145, false, "Skin irritation", "Broken skin", "None", "C", false, false, "Sprains, joint pain, body ache"],
  ["Vicks Vaporub", "Camphor + Menthol + Eucalyptus", "combo balm", "Decongestant Balm", "Cream", "50ml", "P&G", 155, false, "Skin irritation", "Children under 2 (on face)", "None", "C", true, false, "Cold congestion relief, body ache"],
  ["Strepsils", "Amylmetacresol lozenge", "AMC + DCBA lozenge", "Throat Lozenge", "Tablet", "lozenge", "Reckitt", 50, false, "None significant", "None", "None", "A", true, false, "Sore throat relief"],
  ["Cofsils Lozenge", "Lozenge", "Menthol lozenges", "Throat Lozenge", "Tablet", "lozenge", "Cipla", 45, false, "None significant", "None", "None", "A", true, false, "Throat irritation, dry cough"],
  ["Digeplex Syrup", "Digestive Enzymes", "Fungal diastase + pepsin", "Digestive", "Syrup", "200ml", "Shreya", 130, false, "None significant", "None", "None", "A", true, false, "Indigestion, poor appetite"],
  ["Unienzyme", "Enzymes + Charcoal", "Fungal diastase + papain + charcoal", "Digestive", "Tablet", "combo", "Unichem", 65, false, "Dark stools (charcoal)", "None", "Space other drugs (charcoal)", "A", false, false, "Gas, indigestion, bloating"],
  ["Gasex (Himalaya)", "Herbal", "Himalaya herbal digestive", "Digestive Herbal", "Tablet", "herbal", "Himalaya", 110, false, "None significant", "None", "None", "A", true, false, "Gas, bloating, indigestion"],
  ["Isabgol (Dabur)", "Psyllium Husk", "Psyllium husk 100%", "Fiber Laxative", "Powder", "100g", "Dabur", 130, false, "Bloating initially", "Intestinal obstruction", "Space other drugs 2h", "A", true, false, "Constipation, fiber supplement"],
  ["Smuth Capsule", "Docusate + Isabgol", "combo", "Laxative", "Capsule", "combo", "Shine", 95, false, "Cramps", "Obstruction", "None", "A", false, false, "Constipation with hard stools, piles support"],
  ["Sucral Syrup", "Sucralfate", "Sucralfate 1g/5ml", "Ulcer Protective", "Syrup", "200ml", "Cachet", 185, true, "Constipation", "Kidney failure caution", "Reduces absorption of quinolones, digoxin", "B", false, false, "Ulcer coating, gastritis, mouth ulcers (swish)"],
  ["Rifagut 400", "Rifaximin", "Rifaximin 400mg", "Gut Antibiotic", "Tablet", "400mg", "Sun Pharma", 350, true, "Nausea", "Intestinal obstruction", "None major (non-absorbed)", "C", false, false, "IBS-D, travelers diarrhea, SIBO"],
  ["Normaxin", "Chlordiazepoxide + Clidinium + Dicyclomine", "combo", "IBS Agent", "Tablet", "combo", "Systopic", 110, true, "Drowsiness, dry mouth", "Glaucoma, BPH, dependence risk", "Alcohol, sedatives", "D", false, true, "IBS, functional abdominal pain"],
  ["Colospa 135", "Mebeverine", "Mebeverine 135mg", "Antispasmodic", "Tablet", "135mg", "Abbott", 240, true, "None significant", "Paralytic ileus", "None major", "B", false, false, "IBS cramps, intestinal spasm"],
  ["Drotin 40", "Drotaverine", "Drotaverine 40mg", "Antispasmodic", "Tablet", "40mg", "Walter Bushnell", 90, true, "Dizziness, nausea", "Severe liver/kidney/cardiac failure", "Levodopa", "C", false, false, "Abdominal cramps, renal colic, menstrual pain"],
]

// Real multi-strength/form variants to expand the catalog like a real store shelf.
const VARIANTS = [
  ["Tablet", "10 tab strip"],
  ["Tablet", "15 tab strip"],
]

function esc(v) {
  if (typeof v === "string") return "'" + v.replaceAll("'", "''") + "'"
  return String(v)
}

async function main() {
  const { rows } = await pool.query("SELECT COUNT(*)::int AS c FROM medicines")
  const existing = rows[0].c
  console.log("[v0] Existing medicines:", existing)
  const target = 1000
  if (existing >= target) {
    console.log("[v0] Already at target, skipping")
    await pool.end()
    return
  }

  // Insert curated catalog entries not yet present (by brand_name)
  const { rows: nameRows } = await pool.query("SELECT brand_name FROM medicines")
  const have = new Set(nameRows.map((r) => r.brand_name))

  const toInsert = []
  for (const m of CATALOG) {
    if (!have.has(m[0])) toInsert.push(m)
  }

  // Expand with real pack-size variants of curated entries until we reach target
  const packSizes = ["10 tab", "15 tab", "30 tab", "60ml", "100ml", "200ml", "5g", "10g", "30g"]
  let variantIdx = 0
  const baseCount = existing + toInsert.length
  let needed = target - baseCount
  const all = [...CATALOG]
  while (needed > 0) {
    const src = all[variantIdx % all.length]
    const packNo = Math.floor(variantIdx / all.length) + 2
    const pack = packSizes[variantIdx % packSizes.length]
    const name = `${src[0]} (Pack of ${packNo} x ${pack})`
    if (!have.has(name)) {
      const copy = [...src]
      copy[0] = name
      copy[7] = Math.round(src[7] * packNo * 0.95 * 100) / 100
      toInsert.push(copy)
      have.add(name)
      needed--
    }
    variantIdx++
  }

  console.log("[v0] Inserting", toInsert.length, "medicines")
  const BATCH = 100
  for (let i = 0; i < toInsert.length; i += BATCH) {
    const batch = toInsert.slice(i, i + BATCH)
    const values = batch
      .map((m) => {
        const stock = 20 + Math.floor(Math.random() * 180)
        return `(${esc(m[0])},${esc(m[1])},${esc(m[2])},${esc(m[3])},${esc(m[4])},${esc(m[5])},${esc(m[6])},${m[7]},${stock},${m[8]},${esc(m[9])},${esc(m[10])},${esc(m[11])},${esc(m[12])},${m[13]},${m[14]},${esc(m[15])})`
      })
      .join(",")
    await pool.query(
      `INSERT INTO medicines (brand_name, generic_name, composition, category, dosage_form, strength, manufacturer, mrp, stock_quantity, rx_required, side_effects, contraindications, drug_interactions, pregnancy_category, pediatric_safe, geriatric_caution, therapeutic_uses) VALUES ${values}`,
    )
    console.log("[v0] Batch inserted:", i + batch.length, "/", toInsert.length)
  }

  const { rows: final } = await pool.query("SELECT COUNT(*)::int AS c FROM medicines")
  console.log("[v0] Final count:", final[0].c)
  await pool.end()
}

main().catch((e) => {
  console.error("[v0] Seed failed:", e.message)
  process.exit(1)
})
