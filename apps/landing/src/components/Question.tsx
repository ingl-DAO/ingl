import { ExpandLessRounded, ExpandMoreRounded } from '@mui/icons-material';
import { Box, Collapse, IconButton, Tooltip, Typography } from '@mui/material';
import { useState } from 'react';
import theme from '../theme/theme';

export default function Question({
  question: { question, answer },
}: {
  question: { question: string; answer: string };
}) {
  const [isQuestionOpen, setIsQuestionOpen] = useState<boolean>(false);
  return (
    <Box
      sx={{
        border: `1px solid ${theme.palette.secondary.main}`,
        padding: '11px 30px',
        borderRadius: '20px',
      }}
    >
      <Box
        onClick={() => setIsQuestionOpen(!isQuestionOpen)}
        sx={{
          display: 'grid',
          gridTemplateColumns: '1fr auto',
          alignItems: 'center',
        }}
      >
        <Typography>{question}</Typography>
        <IconButton
          size="small"
          onClick={() => setIsQuestionOpen(!isQuestionOpen)}
        >
          <Tooltip arrow title="expand more">
            {isQuestionOpen ? (
              <ExpandLessRounded fontSize="large" color="secondary" />
            ) : (
              <ExpandMoreRounded fontSize="large" color="secondary" />
            )}
          </Tooltip>
        </IconButton>
      </Box>
      <Collapse
        sx={{ marginTop: isQuestionOpen ? '28px' : 0 }}
        in={isQuestionOpen}
      >
        <Typography variant="caption">{answer}</Typography>
      </Collapse>
    </Box>
  );
}
