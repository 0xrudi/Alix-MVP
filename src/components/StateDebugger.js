// StateDebugger.js
import React from 'react';
import { useSelector } from 'react-redux';
import { Box, VStack, Heading, Text, Accordion, AccordionItem, AccordionButton, AccordionPanel, AccordionIcon } from '@chakra-ui/react';

const StateDebugger = () => {
  const catalogs = useSelector(state => state.catalogs);
  const folders = useSelector(state => state.folders);

  const formatData = (data) => {
    return JSON.stringify(data, null, 2);
  };

  // Calculate assignment analysis
  const assignedCatalogCount = Object.values(folders.relationships || {})
    .flat()
    .filter((id, index, self) => self.indexOf(id) === index)
    .length;

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
                <Text fontWeight="bold">User Catalogs ({Object.keys(catalogs.items || {}).length})</Text>
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
                <Text fontWeight="bold">Folders ({Object.keys(folders.folders || {}).length})</Text>
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

          // In StateDebugger.js, update the Assignment Analysis AccordionItem:
          <AccordionItem>
            <AccordionButton>
                <Box flex="1" textAlign="left">
                <Text fontWeight="bold">Assignment Analysis</Text>
                </Box>
                <AccordionIcon />
            </AccordionButton>
            <AccordionPanel>
                <VStack align="stretch" spacing={3}>
                {/* Catalog Stats */}
                <Box borderWidth="1px" p={3} borderRadius="md">
                    <Text fontWeight="bold">Catalog Analysis:</Text>
                    <Text>Total Catalogs: {Object.keys(catalogs.items || {}).length}</Text>
                    <Text>System Catalogs: {Object.keys(catalogs.systemCatalogs || {}).length}</Text>
                    <Text>User Catalogs: {Object.keys(catalogs.items || {}).filter(id => !catalogs.items[id].isSystem).length}</Text>
                </Box>

                {/* Folder Stats */}
                <Box borderWidth="1px" p={3} borderRadius="md">
                    <Text fontWeight="bold">Folder Analysis:</Text>
                    <Text>Total Folders: {Object.keys(folders.folders || {}).length}</Text>
                    <VStack align="stretch" mt={2}>
                    {Object.entries(folders.folders || {}).map(([folderId, folder]) => (
                        <Box key={folderId} pl={2}>
                        <Text fontSize="sm">
                            {folder.name}: {(folders.relationships[folderId] || []).length} catalogs
                        </Text>
                        {folders.relationships[folderId]?.length > 0 && (
                            <Text fontSize="xs" color="gray.500" pl={2}>
                            Assigned catalogs: {folders.relationships[folderId].join(', ')}
                            </Text>
                        )}
                        </Box>
                    ))}
                    </VStack>
                </Box>

                {/* Unassigned Analysis */}
                <Box borderWidth="1px" p={3} borderRadius="md">
                    <Text fontWeight="bold">Unassigned Analysis:</Text>
                    {(() => {
                    const allCatalogIds = Object.keys(catalogs.items || {});
                    const assignedIds = new Set(
                        Object.values(folders.relationships || {}).flat()
                    );
                    const unassignedIds = allCatalogIds.filter(id => !assignedIds.has(id));
                    
                    return (
                        <>
                        <Text>Unassigned Catalogs: {unassignedIds.length}</Text>
                        {unassignedIds.length > 0 && (
                            <Text fontSize="xs" color="gray.500" pl={2}>
                            IDs: {unassignedIds.join(', ')}
                            </Text>
                        )}
                        </>
                    );
                    })()}
                </Box>

                {/* Recent Changes */}
                <Box borderWidth="1px" p={3} borderRadius="md">
                    <Text fontWeight="bold">All Assigned Catalogs:</Text>
                    <Text>{Object.values(folders.relationships || {})
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