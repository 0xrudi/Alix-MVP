import { selectCatalogCount } from "../redux/slices/catalogSlice";
import { useSelector } from 'react-redux';
import {
    Heading,
    Text,
    Button,
    HStack
  } from "@chakra-ui/react";
  import { StyledCard } from '../styles/commonStyles';


const CatalogCard = ({ catalog, onView, onEdit, onDelete }) => {
  const nftCount = useSelector(state => selectCatalogCount(state, catalog.id));

  return (
    <StyledCard>
      <Heading as="h4" size="sm">{catalog.name}</Heading>
      <Text>{nftCount} Artifacts</Text>
      <HStack mt="0.5rem">
        <Button size="sm" onClick={onView}>
          View
        </Button>
        {!catalog.isSystem && (
          <>
            <Button size="sm" onClick={onEdit}>
              Edit
            </Button>
            <Button size="sm" colorScheme="red" onClick={onDelete}>
              Delete
            </Button>
          </>
        )}
      </HStack>
    </StyledCard>
  );
};

export default CatalogCard;