import React from 'react';
import { Container, Box } from '@mui/material';
import { CVOverview } from '@/components/cv/CVOverview';
import { CV } from '@/types/cv';

interface CVOverviewPageProps {
  cvs: CV[];
  onSelectCV: (cv: CV) => void;
}

export const CVOverviewPage: React.FC<CVOverviewPageProps> = ({ cvs, onSelectCV }) => {
  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <CVOverview cvs={cvs} onSelectCV={onSelectCV} />
      </Box>
    </Container>
  );
}; 