import React, { useState, useEffect } from 'react';
import Header from '../../components/Header';
import { Container, TextField, Typography, Box, CircularProgress, Button } from '@mui/material';
import { styled } from '@stitches/react';
import SearchIcon from '@mui/icons-material/Search';
import { getCompanies, deleteCompany } from '../../services/api';
import { saveAs } from 'file-saver';
import { stringify } from 'csv-stringify/browser/esm';
import ItemList from '../../components/ItemList';
import { Company } from '../../types';
import Notification from '../../components/Notification';
import ConfirmDialog from '../../components/ConfirmDialog';

const ListContainer = styled(Container, {
  marginTop: '20px',
});

const ListCompany: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [severity, setSeverity] = useState<'success' | 'error' | 'info'>('success');
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const data = await getCompanies();
        setCompanies(data);
      } catch (error) {
        console.error('Error fetching companies:', error);
        setMessage('Erro ao buscar empresas');
        setSeverity('error');
        setNotificationOpen(true);
      } finally {
        setLoading(false);
      }
    };
    fetchCompanies();
  }, []);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleEdit = (company: Company) => {
    console.log('Edit company:', company);
    setMessage('Editando empresa...');
    setSeverity('info');
    setNotificationOpen(true);
  };

  const handleOpenDialog = (company: Company) => {
    setCompanyToDelete(company);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setCompanyToDelete(null);
  };

  const handleDelete = async () => {
    if (companyToDelete) {
      setDeleting(true);
      try {
        await deleteCompany(companyToDelete.id);
        setCompanies(companies.filter(comp => comp.id !== companyToDelete.id));
        setMessage('Empresa excluída com sucesso');
        setSeverity('success');
      } catch (error) {
        console.error('Error deleting company:', error);
        setMessage('Erro ao excluir empresa');
        setSeverity('error');
      } finally {
        setNotificationOpen(true);
        setDialogOpen(false);
        setCompanyToDelete(null);
        setDeleting(false);
      }
    }
  };

  const handleExportCSV = () => {
    const data = companies.map(({ id, name, superUser }) => ({ ID: id, Nome: name, 'Super Usuário': superUser }));
    stringify(
      data,
      {
        header: true,
      },
      (err, output) => {
        if (!err) {
          const blob = new Blob([output], { type: 'text/csv;charset=utf-8;' });
          saveAs(blob, 'companies.csv');
        }
      }
    );
  };

  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleNotificationClose = () => {
    setNotificationOpen(false);
  };

  return (
    <div>
      <Header />
      <ListContainer maxWidth="md">
        <Box sx={{ display: 'flex', alignItems: 'center', margin: '20px 0' }}>
          <TextField
            variant="outlined"
            placeholder="Pesquisar"
            fullWidth
            value={searchTerm}
            onChange={handleSearchChange}
            InputProps={{
              endAdornment: (
                <SearchIcon />
              ),
            }}
          />
        </Box>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', marginTop: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <ItemList items={filteredCompanies} onEdit={handleEdit} onDelete={handleOpenDialog} />
        )}
        <Button variant="contained" color="primary" onClick={handleExportCSV} disabled={companies.length === 0} sx={{ marginTop: 2 }}>
          Exportar para CSV
        </Button>
      </ListContainer>
      <ConfirmDialog
        open={dialogOpen}
        title="Confirmação de exclusão"
        content="Tem certeza de que deseja excluir esta empresa? Esta ação não pode ser desfeita."
        onConfirm={handleDelete}
        onCancel={handleCloseDialog}
        loading={deleting}
      />
      <Notification
        message={message}
        severity={severity}
        open={notificationOpen}
        onClose={handleNotificationClose}
      />
    </div>
  );
};

export default ListCompany;
