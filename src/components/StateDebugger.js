import React from 'react';
import { useSelector } from 'react-redux';
import { Box, VStack, Heading, Text, Accordion, AccordionItem, AccordionButton, AccordionPanel, AccordionIcon } from '@chakra-ui/react';

const StateDebugger = () => {
  const catalogs = useSelector(state => state.catalogs);
  const folders = useSelector(state => state.folders);

  const formatData = (data) => {
    return JSON.stringify(data, null, 2);
  };

  return (
    <Box 
      position="fixed"
      bottom="20px"
      right="20px"
      width="400px"
      maxHeight="80vh"
      overflowY="auto"
      bg="white"
      boxShadow="lg"
      borderRadius="md"
      p={4}
      zIndex={1000}
    >
      <VStack align="stretch" spacing={4}>
        <Heading size="md">State Debugger</Heading>
        
        <Accordion allowMultiple>
          <AccordionItem>
            <AccordionButton>
              <Box flex="1" textAlign="left">
                <Text fontWeight="bold">User Catalogs ({Object.keys(catalogs.items).length})</Text>
              </Box>
              <AccordionIcon />
            </AccordionButton>
            <AccordionPanel>
              <pre style={{ fontSize: '12px' }}>{formatData(catalogs.items)}</pre>
            </AccordionPanel>
          </AccordionItem>

          <AccordionItem>
            <AccordionButton>
              <Box flex="1" textAlign="left">
                <Text fontWeight="bold">System Catalogs ({Object.keys(catalogs.systemCatalogs).length})</Text>
              </Box>
              <AccordionIcon />
            </AccordionButton>
            <AccordionPanel>
              <pre style={{ fontSize: '12px' }}>{formatData(catalogs.systemCatalogs)}</pre>
            </AccordionPanel>
          </AccordionItem>

          <AccordionItem>
            <AccordionButton>
              <Box flex="1" textAlign="left">
                <Text fontWeight="bold">Folders ({Object.keys(folders.folders).length})</Text>
              </Box>
              <AccordionIcon />
            </AccordionButton>
            <AccordionPanel>
              <pre style={{ fontSize: '12px' }}>{formatData(folders.folders)}</pre>
            </AccordionPanel>
          </AccordionItem>

          <AccordionItem>
            <AccordionButton>
              <Box flex="1" textAlign="left">
                <Text fontWeight="bold">Folder Relationships</Text>
              </Box>
              <AccordionIcon />
            </AccordionButton>
            <AccordionPanel>
              <pre style={{ fontSize: '12px' }}>{formatData(folders.relationships)}</pre>
            </AccordionPanel>
          </AccordionItem>
          <AccordionItem>
            <AccordionButton>
              <Box flex="1" textAlign="left">
                <Text fontWeight="bold">Unassigned Analysis</Text>
              </Box>
              <AccordionIcon />
            </AccordionButton>
            <AccordionPanel>
              <VStack align="stretch" spacing={2}>
                <Box>
                  <Text fontWeight="bold">Total Catalogs:</Text>
                  <Text>{Object.keys(catalogs.items || {}).length}</Text>
                </Box>
                <Box>
                  <Text fontWeight="bold">Folder Assignment Counts:</Text>
                  {Object.entries(folders.relationships).map(([folderId, catalogIds]) => (
                    <Text key={folderId}>
                      {folders.folders[folderId]?.name}: {catalogIds.length} catalogs
                    </Text>
                  ))}
                </Box>
                <Box>
                  <Text fontWeight="bold">All Assigned Catalogs:</Text>
                  <Text>
                    {Object.values(folders.relationships)
                      .flat()
                      .filter((id, index, self) => self.indexOf(id) === index)
                      .length} unique catalogs
                  </Text>
                </Box>
              </VStack>
            </AccordionPanel>
          </AccordionItem>
        </Accordion>
      </VStack>
    </Box>
  );
};

export default StateDebugger;