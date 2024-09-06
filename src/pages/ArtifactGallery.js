import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const ArtifactGallery = () => {
  const [artifacts, setArtifacts] = useState([]);

  useEffect(() => {
    // In a real application, you would fetch artifacts from an API here
    const mockArtifacts = [
      { id: 1, title: 'Digital Painting', type: 'Image', description: 'A vibrant digital artwork' },
      { id: 2, title: 'Short Story', type: 'Text', description: 'A compelling short fiction piece' },
      { id: 3, title: '3D Model', type: 'Model', description: 'A detailed 3D sculpture' },
    ];
    setArtifacts(mockArtifacts);
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Artifact Gallery</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {artifacts.map(artifact => (
          <Card key={artifact.id}>
            <CardHeader>
              <CardTitle>{artifact.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 mb-2">Type: {artifact.type}</p>
              <p>{artifact.description}</p>
              <Button className="mt-4">View Details</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ArtifactGallery;