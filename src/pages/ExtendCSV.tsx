import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, FileText, CheckCircle2 } from 'lucide-react';
import { extendCSV } from '@/utils/extendCsvData';

export default function ExtendCSV() {
  const [status, setStatus] = useState<'idle' | 'processing' | 'complete'>('idle');
  const [preview, setPreview] = useState<string>('');

  const handleGenerate = async () => {
    try {
      setStatus('processing');
      
      // Read existing CSV
      const response = await fetch('/dat.csv');
      const csvText = await response.text();
      
      // Generate extended CSV
      const extendedCSV = await extendCSV(csvText);
      
      // Show preview
      const previewLines = extendedCSV.split('\n').slice(0, 4).join('\n');
      setPreview(previewLines);
      
      // Download the file
      const blob = new Blob([extendedCSV], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'dat_extended.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setStatus('complete');
      
    } catch (error) {
      console.error('Error generating CSV:', error);
      alert('Error generating CSV. Check console for details.');
      setStatus('idle');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle p-8">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-6 w-6" />
              Extend CSV with Clinical Factors
            </CardTitle>
            <CardDescription>
              This tool extends the existing dat.csv with 42 new clinical factor columns,
              generating weighted random values based on real-world distributions.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-muted/30 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">New Columns Being Added:</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Advanced_Pain_Treatment</li>
                    <li>• Causation_Compliance</li>
                    <li>• Clinical_Findings</li>
                    <li>• Cognitive_Symptoms</li>
                    <li>• Complete_Disability_Duration</li>
                    <li>• Concussion_Diagnosis</li>
                    <li>• Consciousness_Impact</li>
                    <li>• Consistent_Mechanism</li>
                    <li>• Dental_Procedure</li>
                    <li>• Emergency_Treatment</li>
                    <li>• Fixation_Method</li>
                    <li>• Head_Trauma</li>
                    <li>• Immobilization_Used</li>
                    <li>• Injury_Count</li>
                    <li>• Injury_Extent</li>
                    <li>• Injury_Laterality</li>
                    <li>• Injury_Location</li>
                    <li>• Injury_Type</li>
                    <li>• Mobility_Assistance</li>
                    <li>• Movement_Restriction</li>
                    <li>• Nerve_Involvement</li>
                  </ul>
                </div>
                <div>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Pain_Management</li>
                    <li>• Partial_Disability_Duration</li>
                    <li>• Physical_Symptoms</li>
                    <li>• Physical_Therapy</li>
                    <li>• Prior_Treatment</li>
                    <li>• Recovery_Duration</li>
                    <li>• Repair_Type</li>
                    <li>• Respiratory_Issues</li>
                    <li>• Soft_Tissue_Damage</li>
                    <li>• Special_Treatment</li>
                    <li>• Surgical_Intervention</li>
                    <li>• Symptom_Timeline</li>
                    <li>• Treatment_Compliance</li>
                    <li>• Treatment_Course</li>
                    <li>• Treatment_Delays</li>
                    <li>• Treatment_Level</li>
                    <li>• Treatment_Period_Considered</li>
                    <li>• Vehicle_Impact</li>
                    <li>• Dental_Treatment</li>
                    <li>• Dental_Visibility</li>
                  </ul>
                </div>
              </div>
            </div>

            <Button 
              onClick={handleGenerate} 
              disabled={status === 'processing'}
              className="w-full"
              size="lg"
            >
              {status === 'processing' ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Processing...
                </>
              ) : status === 'complete' ? (
                <>
                  <CheckCircle2 className="h-5 w-5 mr-2" />
                  Generated! Click to Download Again
                </>
              ) : (
                <>
                  <Download className="h-5 w-5 mr-2" />
                  Generate Extended CSV
                </>
              )}
            </Button>

            {status === 'complete' && (
              <div className="space-y-4">
                <div className="bg-success/10 border border-success/30 rounded-lg p-4">
                  <h4 className="font-semibold text-success mb-2">✓ Success!</h4>
                  <p className="text-sm text-muted-foreground">
                    The extended CSV has been downloaded. Replace the file at{' '}
                    <code className="bg-muted px-2 py-1 rounded">public/dat.csv</code> with the
                    downloaded file to use the new data.
                  </p>
                </div>

                {preview && (
                  <div>
                    <h4 className="font-semibold mb-2">Preview (first 4 rows):</h4>
                    <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
                      {preview}
                    </pre>
                  </div>
                )}
              </div>
            )}

            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                ℹ️ How to Use:
              </h4>
              <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-decimal list-inside">
                <li>Click "Generate Extended CSV" button</li>
                <li>The file will be downloaded automatically</li>
                <li>Replace <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">public/dat.csv</code> with the downloaded file</li>
                <li>Refresh your application to see the new data</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
