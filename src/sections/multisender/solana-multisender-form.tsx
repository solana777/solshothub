import { useForm } from 'react-hook-form';

import { Card, Stack, Divider, Typography } from '@mui/material';

import { Form } from 'src/components/hook-form';

import MultisenderCrudGrid from './datagrid';

export default function MultisenderForm() {
  const methods = useForm();

  return (
    <Form methods={methods}>
      <Stack direction="row" justifyContent="center" alignItems="center">
        <Card sx={{ p: 3 }}>
          <Typography align="center" variant="h6">
            Send Tokens
          </Typography>
          <Divider sx={{ my: 3 }} />
          <MultisenderCrudGrid />
        </Card>
      </Stack>
    </Form>
  );
}
