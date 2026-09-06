import os
import glob
import numpy as np
import pandas as pd
import mne
import warnings
import traceback

warnings.filterwarnings("ignore")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
ISRUC_DIR = os.path.join(DATA_DIR, "ISRUC-Sleep-II")
NBACK_DIR = os.path.join(DATA_DIR, "Cognitive Workload 5-level n-back")

def extract_psd_bands(raw, start_time, duration):
    """
    Extracts delta, theta, alpha, beta, gamma power from a segment of EEG.
    """
    try:
        # Crop to the segment
        segment = raw.copy().crop(tmin=start_time, tmax=start_time + duration)
        
        # Use Welch method for PSD
        # Note: Depending on MNE version, this might use `compute_psd` or `psd_array_welch`
        psd_result = segment.compute_psd(method='welch', fmin=0.5, fmax=50.0, n_fft=256, verbose=False)
        psds, freqs = psd_result.get_data(return_freqs=True)
        
        # Average across channels
        mean_psds = np.mean(psds, axis=0)
        
        bands = {
            'delta_power': np.mean(mean_psds[(freqs >= 0.5) & (freqs < 4.0)]),
            'theta_power': np.mean(mean_psds[(freqs >= 4.0) & (freqs < 8.0)]),
            'alpha_power': np.mean(mean_psds[(freqs >= 8.0) & (freqs < 13.0)]),
            'beta_power': np.mean(mean_psds[(freqs >= 13.0) & (freqs < 30.0)]),
            'gamma_power': np.mean(mean_psds[(freqs >= 30.0) & (freqs <= 50.0)])
        }
        return bands
    except Exception as e:
        print(f"PSD Extraction failed: {str(e)}")
        traceback.print_exc()
        return None

def process_isruc_dataset(limit=1):
    print("--- Processing ISRUC-Sleep-II Dataset ---")
    data = []
    
    # ISRUC has subfolders like 1/1/1.rec, 1/1/1_1.txt
    rec_files = glob.glob(os.path.join(ISRUC_DIR, "**", "*.rec"), recursive=True)
    
    if not rec_files:
        print("No .rec files found in ISRUC directory.")
        return
        
    for idx, rec_file in enumerate(rec_files[:limit]):
        print(f"Processing {os.path.basename(rec_file)}...")
        try:
            # Find the corresponding labels file
            folder = os.path.dirname(rec_file)
            base_name = os.path.basename(rec_file).replace('.rec', '')
            label_file = os.path.join(folder, f"{base_name}_1.txt") # Rater 1
            
            if not os.path.exists(label_file):
                print(f"Label file not found for {rec_file}")
                continue
                
            labels = np.loadtxt(label_file, dtype=int)
            
            # Load EEG (MNE read_raw_edf requires .edf extension)
            temp_edf = rec_file + ".edf"
            import shutil
            if not os.path.exists(temp_edf):
                shutil.copy2(rec_file, temp_edf)
                
            raw = mne.io.read_raw_edf(temp_edf, preload=True, verbose=False)
            
            epoch_duration = 30.0 # Standard AASM epoch
            
            # Process all available epochs for production model
            max_epochs = len(labels)
            
            for epoch_idx in range(max_epochs):
                start_time = epoch_idx * epoch_duration
                if start_time + epoch_duration > raw.times[-1]:
                    break
                    
                stage = labels[epoch_idx]
                # 0=Wake, 1=N1, 2=N2, 3=N3, 5=REM
                
                bands = extract_psd_bands(raw, start_time, epoch_duration)
                if bands:
                    row = {
                        "subject_id": base_name,
                        "epoch": epoch_idx,
                        "stage": stage
                    }
                    row.update(bands)
                    data.append(row)
                    
        except Exception as e:
            print(f"Failed to process {rec_file}: {str(e)}")
            traceback.print_exc()
            
    if data:
        df = pd.DataFrame(data)
        out_path = os.path.join(DATA_DIR, "isruc_features.csv")
        df.to_csv(out_path, index=False)
        print(f"Saved {len(df)} records to {out_path}")

def process_nback_dataset(limit=1):
    print("--- Processing Cognitive Workload n-back Dataset ---")
    data = []
    
    # BIDS format has sub-001/eeg/...
    vhdr_files = glob.glob(os.path.join(NBACK_DIR, "**", "*.vhdr"), recursive=True)
            
    if not vhdr_files:
        print("No .vhdr files found in Cognitive Workload directory.")
        return
        
    for idx, vhdr_file in enumerate(vhdr_files[:limit]):
        print(f"Processing {os.path.basename(vhdr_file)}...")
        try:
            folder = os.path.dirname(vhdr_file)
            base_name = os.path.basename(vhdr_file).replace('.vhdr', '')
            subject_id = base_name.split('_')[0]
            
            events_file = os.path.join(folder, f"{base_name.replace('_eeg', '')}_events.tsv")
            
            if not os.path.exists(events_file):
                print(f"Events file not found for {vhdr_file}")
                continue
                
            events_df = pd.read_csv(events_file, sep='\t')
            
            # Load EEG (BrainVision format)
            raw = mne.io.read_raw_brainvision(vhdr_file, preload=True, verbose=False)
            
            # Filter for nback trials
            nback_events = events_df[events_df['trial_type'].str.startswith('nback_')].dropna(subset=['onset', 'duration'])
            
            # Process all nback events for production model
            # nback_events = nback_events.head(20) # Limit removed
            
            for _, row in nback_events.iterrows():
                onset = float(row['onset'])
                duration = float(row['duration'])
                trial_type = row['trial_type'] # e.g., 'nback_1', 'nback_2'
                
                # Extract workload level (e.g. 1 from 'nback_1')
                try:
                    workload_level = int(trial_type.split('_')[-1])
                except:
                    continue
                
                if onset + duration <= raw.times[-1]:
                    bands = extract_psd_bands(raw, onset, duration)
                    if bands:
                        feature_row = {
                            "subject_id": subject_id,
                            "workload_level": workload_level,
                            "onset": onset
                        }
                        feature_row.update(bands)
                        data.append(feature_row)
                        
        except Exception as e:
            print(f"Failed to process {vhdr_file}: {str(e)}")
            traceback.print_exc()
            
    if data:
        df = pd.DataFrame(data)
        out_path = os.path.join(DATA_DIR, "nback_features.csv")
        df.to_csv(out_path, index=False)
        print(f"Saved {len(df)} records to {out_path}")

if __name__ == "__main__":
    print("Starting Preprocessing Pipeline...")
    # Using small limits (1) to quickly verify pipeline on standard hardware.
    # On Colab, you would set limit=None to process all subjects.
    process_isruc_dataset(limit=None)
    process_nback_dataset(limit=None)
    print("Preprocessing Complete!")
