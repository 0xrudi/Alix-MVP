import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

const Web3DataSelectionScreen = ({ ensNames, delegations, onImport }) => {
  const [selectedEns, setSelectedEns] = useState(ensNames[0] || '');
  const [selectedDelegations, setSelectedDelegations] = useState(delegations.map(d => d.vault));

  const handleDelegationToggle = (vault) => {
    setSelectedDelegations(prev => 
      prev.includes(vault)
        ? prev.filter(v => v !== vault)
        : [...prev, vault]
    );
  };

  const handleImport = () => {
    onImport({
      selectedEns,
      selectedDelegations: delegations.filter(d => selectedDelegations.includes(d.vault))
    });
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Import Your Web3 Data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* ENS Section */}
          <div>
            <h3 className="text-xl font-semibold mb-2">ENS Domains</h3>
            {ensNames.length > 1 ? (
              <RadioGroup value={selectedEns} onValueChange={setSelectedEns}>
                {ensNames.map((ens) => (
                  <div key={ens} className="flex items-center space-x-2">
                    <RadioGroupItem value={ens} id={ens} />
                    <Label htmlFor={ens}>{ens}</Label>
                  </div>
                ))}
              </RadioGroup>
            ) : ensNames.length === 1 ? (
              <div className="bg-blue-100 p-3 rounded-md text-blue-800">
                {ensNames[0]}
              </div>
            ) : (
              <p className="text-gray-500">No ENS domains found.</p>
            )}
          </div>

          {/* Delegations Section */}
          <div>
            <h3 className="text-xl font-semibold mb-2">Delegations</h3>
            {delegations.length > 0 ? (
              <div className="space-y-2">
                {delegations.map((delegation) => (
                  <div key={delegation.vault} className="flex items-center space-x-2">
                    <Checkbox
                      id={delegation.vault}
                      checked={selectedDelegations.includes(delegation.vault)}
                      onCheckedChange={() => handleDelegationToggle(delegation.vault)}
                    />
                    <Label htmlFor={delegation.vault}>
                      {delegation.vault} (Type: {delegation.type === 1 ? 'Contract' : 'EOA'})
                    </Label>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No delegations found.</p>
            )}
          </div>

          <Button onClick={handleImport} className="w-full">
            Import and Continue
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Web3DataSelectionScreen;
