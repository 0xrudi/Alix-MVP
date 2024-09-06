import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const CreateArtifact = ({ onArtifactCreated }) => {
  const [artifact, setArtifact] = useState({
    title: '',
    type: '',
    description: '',
  });

  const handleInputChange = (e) => {
    setArtifact({ ...artifact, [e.target.name]: e.target.value });
  };

  const handleTypeChange = (value) => {
    setArtifact({ ...artifact, type: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // In a real application, you would send this data to an API
    console.log('Created artifact:', artifact);
    onArtifactCreated();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Artifact</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label>
            <Input
              type="text"
              id="title"
              name="title"
              value={artifact.title}
              onChange={handleInputChange}
              required
            />
          </div>
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700">Type</label>
            <Select onValueChange={handleTypeChange} required>
              <SelectTrigger>
                <SelectValue placeholder="Select artifact type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Image">Image</SelectItem>
                <SelectItem value="Text">Text</SelectItem>
                <SelectItem value="Model">3D Model</SelectItem>
                <SelectItem value="Audio">Audio</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
            <Input
              type="text"
              id="description"
              name="description"
              value={artifact.description}
              onChange={handleInputChange}
            />
          </div>
          <Button type="submit">Create Artifact</Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default CreateArtifact;