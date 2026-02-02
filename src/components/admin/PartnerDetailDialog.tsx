import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { partnerUsersApi, merchantsApi, type PaginatedResponse } from '../../api/client';
import { type PaginationState, defaultPagination } from '@/types/dashboard.types';
import { getStatusConfig } from '@/lib/constants';
import { PaginationControls } from '@/components/shared/PaginationControls';
import { TableSkeleton } from '@/components/shared/TableSkeleton';
import { PartnerUserDialog } from './PartnerUserDialog';
import { ChangePasswordDialog } from './ChangePasswordDialog';
import { MerchantDialog } from './MerchantDialog';
import { MerchantDetailDialog } from './MerchantDetailDialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Eye,
  Handshake,
  KeyRound,
  Pencil,
  Plus,
  Store,
  Trash2,
  Users,
} from 'lucide-react';

interface PartnerDetailDialogProps {
  item: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PartnerDetailDialog({ item, open, onOpenChange }: PartnerDetailDialogProps) {
  const { t } = useTranslation('admin');
  const [innerTab, setInnerTab] = useState('users');

  // Users state
  const [users, setUsers] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersPagination, setUsersPagination] = useState<PaginationState>(defaultPagination);

  // Merchants state
  const [merchants, setMerchants] = useState<any[]>([]);
  const [merchantsLoading, setMerchantsLoading] = useState(false);
  const [merchantsPagination, setMerchantsPagination] = useState<PaginationState>(defaultPagination);

  // Sub-dialog states
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [changePasswordUser, setChangePasswordUser] = useState<any>(null);
  const [merchantDialogOpen, setMerchantDialogOpen] = useState(false);
  const [selectedMerchant, setSelectedMerchant] = useState<any>(null);

  const loadUsers = useCallback(async () => {
    if (!item?._id) return;
    setUsersLoading(true);
    try {
      const res = await partnerUsersApi.listByPartner(item._id, {
        page: usersPagination.page,
        limit: usersPagination.limit,
      });
      const data = res.data as PaginatedResponse<any>;
      setUsers(data.data);
      setUsersPagination(prev => ({ ...prev, ...data.meta }));
    } catch {
      setUsers([]);
    } finally {
      setUsersLoading(false);
    }
  }, [item?._id, usersPagination.page, usersPagination.limit]);

  const loadMerchants = useCallback(async () => {
    if (!item?._id) return;
    setMerchantsLoading(true);
    try {
      const res = await merchantsApi.list({
        page: merchantsPagination.page,
        limit: merchantsPagination.limit,
      });
      const data = res.data as PaginatedResponse<any>;
      const filtered = data.data.filter((m: any) => m.owner === item._id);
      setMerchants(filtered);
      setMerchantsPagination(prev => ({ ...prev, total: filtered.length, totalPages: 1 }));
    } catch {
      setMerchants([]);
    } finally {
      setMerchantsLoading(false);
    }
  }, [item?._id, merchantsPagination.page, merchantsPagination.limit]);

  useEffect(() => {
    if (open && item?._id) {
      setInnerTab('users');
      setUsersPagination(defaultPagination);
      setMerchantsPagination(defaultPagination);
    }
  }, [open, item?._id]);

  useEffect(() => {
    if (open && item?._id && innerTab === 'users') {
      loadUsers();
    }
  }, [open, item?._id, innerTab, loadUsers]);

  useEffect(() => {
    if (open && item?._id && innerTab === 'merchants') {
      loadMerchants();
    }
  }, [open, item?._id, innerTab, loadMerchants]);

  const handleDeleteUser = async (id: string) => {
    try {
      await partnerUsersApi.delete(id);
      loadUsers();
    } catch {
      // silently fail
    }
  };

  const openCreateUser = () => {
    setEditingUser(null);
    setUserDialogOpen(true);
  };

  const openEditUser = (user: any) => {
    setEditingUser(user);
    setUserDialogOpen(true);
  };

  if (!item) return null;
  const statusConfig = getStatusConfig(item.status);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800/80 shadow-xl shadow-amber-900/5 dark:shadow-amber-900/20 p-0 gap-0 overflow-hidden">
          {/* Decorative top accent */}
          <div className="h-1 w-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600" />

          <DialogHeader className="px-6 pt-5 pb-0">
            <DialogTitle className="flex items-center gap-3 text-lg">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-md shadow-amber-500/20">
                <Handshake className="w-4.5 h-4.5 text-white" />
              </div>
              <span className="text-zinc-900 dark:text-zinc-50">
                {t('dialogs.partnerDetail.title')}
              </span>
            </DialogTitle>
            <DialogDescription className="mt-1.5 pl-12 text-zinc-500 dark:text-zinc-400">
              {t('dialogs.partnerDetail.description', { name: item.fantasy_name })}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[calc(90vh-100px)]">
            <div className="px-6 pb-6 pt-4 grid gap-4">
              {/* Partner Info */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-zinc-500 dark:text-zinc-400 text-xs">{t('dialogs.partnerDetail.fantasyName')}</Label>
                  <p className="font-medium text-zinc-900 dark:text-white mt-0.5">{item.fantasy_name || '-'}</p>
                </div>
                <div>
                  <Label className="text-zinc-500 dark:text-zinc-400 text-xs">{t('dialogs.partnerDetail.businessName')}</Label>
                  <p className="font-medium text-zinc-900 dark:text-white mt-0.5">{item.business_name || '-'}</p>
                </div>
                <div>
                  <Label className="text-zinc-500 dark:text-zinc-400 text-xs">{t('dialogs.partnerDetail.taxId')}</Label>
                  <p className="font-medium text-zinc-900 dark:text-white mt-0.5">{item.tax_id || '-'}</p>
                </div>
                <div>
                  <Label className="text-zinc-500 dark:text-zinc-400 text-xs">{t('dialogs.partnerDetail.contactName')}</Label>
                  <p className="font-medium text-zinc-900 dark:text-white mt-0.5">{item.contact_name || '-'}</p>
                </div>
                <div>
                  <Label className="text-zinc-500 dark:text-zinc-400 text-xs">{t('dialogs.partnerDetail.contactEmail')}</Label>
                  <p className="font-medium text-zinc-900 dark:text-white mt-0.5">{item.contact_email || '-'}</p>
                </div>
                <div>
                  <Label className="text-zinc-500 dark:text-zinc-400 text-xs">{t('dialogs.partnerDetail.status')}</Label>
                  <div className="mt-1">
                    <Badge variant={statusConfig.variant} className={statusConfig.className}>
                      {statusConfig.label}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* IDs & Timestamps */}
              <div className="border-t border-zinc-100 dark:border-zinc-800/80 pt-4 grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-zinc-500 dark:text-zinc-400 text-xs">{t('dialogs.partnerDetail.partnerId')}</Label>
                  <p className="font-mono text-sm bg-zinc-50/80 dark:bg-zinc-800/50 p-2 rounded-lg mt-0.5">{item._id}</p>
                </div>
                <div>
                  <Label className="text-zinc-500 dark:text-zinc-400 text-xs">{t('dialogs.common.createdAt')}</Label>
                  <p className="text-sm text-zinc-700 dark:text-zinc-300 mt-0.5">
                    {item.createdAt ? new Date(item.createdAt).toLocaleString() : '-'}
                  </p>
                </div>
                <div>
                  <Label className="text-zinc-500 dark:text-zinc-400 text-xs">{t('dialogs.common.updatedAt')}</Label>
                  <p className="text-sm text-zinc-700 dark:text-zinc-300 mt-0.5">
                    {item.updatedAt ? new Date(item.updatedAt).toLocaleString() : '-'}
                  </p>
                </div>
              </div>

              {/* Inner Tabs */}
              <div className="border-t border-zinc-100 dark:border-zinc-800/80 pt-4">
                <Tabs value={innerTab} onValueChange={setInnerTab}>
                  <TabsList className="bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg">
                    <TabsTrigger
                      value="users"
                      className="data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-700 rounded-md px-4"
                    >
                      <Users className="w-4 h-4 mr-2" />
                      {t('dialogs.partnerDetail.usersTab')}
                    </TabsTrigger>
                    <TabsTrigger
                      value="merchants"
                      className="data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-700 rounded-md px-4"
                    >
                      <Store className="w-4 h-4 mr-2" />
                      {t('dialogs.partnerDetail.merchantsTab')}
                    </TabsTrigger>
                  </TabsList>

                  {/* Users Tab */}
                  <TabsContent value="users" className="mt-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        {t('dialogs.partnerDetail.partnerUsers', { count: usersPagination.total })}
                      </h4>
                      <Button
                        size="sm"
                        onClick={openCreateUser}
                        className="gap-1 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-sm shadow-amber-500/15"
                      >
                        <Plus className="h-3 w-3" />
                        {t('dialogs.partnerDetail.createUser')}
                      </Button>
                    </div>
                    {usersLoading ? (
                      <TableSkeleton />
                    ) : (
                      <>
                        <Table>
                          <TableHeader>
                            <TableRow className="hover:bg-transparent">
                              <TableHead>{t('dialogs.partnerDetail.columns.name')}</TableHead>
                              <TableHead>{t('dialogs.partnerDetail.columns.email')}</TableHead>
                              <TableHead>{t('dialogs.partnerDetail.columns.type')}</TableHead>
                              <TableHead>{t('dialogs.partnerDetail.columns.status')}</TableHead>
                              <TableHead className="text-right">{t('dialogs.partnerDetail.columns.actions')}</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {users.map((u) => {
                              const uStatus = getStatusConfig(u.status);
                              return (
                                <TableRow key={u._id} className="hover:bg-amber-50/50 dark:hover:bg-amber-900/10">
                                  <TableCell className="font-medium text-zinc-900 dark:text-white">
                                    {u.name}
                                  </TableCell>
                                  <TableCell className="text-zinc-600 dark:text-zinc-400">{u.email}</TableCell>
                                  <TableCell>
                                    <Badge variant="outline" className="text-xs">{u.type}</Badge>
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant={uStatus.variant} className={uStatus.className}>
                                      {uStatus.label}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex gap-1 justify-end">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => openEditUser(u)}
                                        title={t('dialogs.partnerDetail.editUser')}
                                        className="h-7 w-7 p-0 border-zinc-200 dark:border-zinc-700"
                                      >
                                        <Pencil className="h-3 w-3" />
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setChangePasswordUser(u)}
                                        title={t('dialogs.partnerDetail.changePassword')}
                                        className="h-7 w-7 p-0 border-zinc-200 dark:border-zinc-700"
                                      >
                                        <KeyRound className="h-3 w-3" />
                                      </Button>
                                      <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 border-red-200 dark:border-red-900/50"
                                          >
                                            <Trash2 className="h-3 w-3" />
                                          </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent className="bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800/80">
                                          <AlertDialogHeader>
                                            <AlertDialogTitle>{t('dialogs.partnerDetail.deleteUser')}</AlertDialogTitle>
                                            <AlertDialogDescription>
                                              {t('dialogs.partnerDetail.deleteUserMessage', { name: u.name || u.email })}
                                            </AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter>
                                            <AlertDialogCancel className="border-zinc-200 dark:border-zinc-700">{t('dialogs.common.cancel')}</AlertDialogCancel>
                                            <AlertDialogAction
                                              onClick={() => handleDeleteUser(u._id)}
                                              className="bg-red-500 hover:bg-red-600 text-white"
                                            >
                                              {t('dialogs.common.delete')}
                                            </AlertDialogAction>
                                          </AlertDialogFooter>
                                        </AlertDialogContent>
                                      </AlertDialog>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                            {users.length === 0 && (
                              <TableRow>
                                <TableCell colSpan={5} className="text-center text-zinc-500 py-8">
                                  {t('dialogs.partnerDetail.noUsers')}
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                        <PaginationControls
                          pagination={usersPagination}
                          onPageChange={(p) => setUsersPagination(prev => ({ ...prev, page: p }))}
                        />
                      </>
                    )}
                  </TabsContent>

                  {/* Merchants Tab */}
                  <TabsContent value="merchants" className="mt-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        {t('dialogs.partnerDetail.merchantsCount', { count: merchantsPagination.total })}
                      </h4>
                      <Button
                        size="sm"
                        onClick={() => setMerchantDialogOpen(true)}
                        className="gap-1 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-sm shadow-amber-500/15"
                      >
                        <Plus className="h-3 w-3" />
                        {t('dialogs.partnerDetail.createMerchant')}
                      </Button>
                    </div>
                    {merchantsLoading ? (
                      <TableSkeleton />
                    ) : (
                      <>
                        <Table>
                          <TableHeader>
                            <TableRow className="hover:bg-transparent">
                              <TableHead>{t('dialogs.partnerDetail.merchantColumns.fantasyName')}</TableHead>
                              <TableHead>{t('dialogs.partnerDetail.merchantColumns.legalName')}</TableHead>
                              <TableHead>{t('dialogs.partnerDetail.merchantColumns.status')}</TableHead>
                              <TableHead className="text-right">{t('dialogs.partnerDetail.merchantColumns.actions')}</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {merchants.map((m) => {
                              const mStatus = getStatusConfig(m.status);
                              return (
                                <TableRow key={m._id} className="hover:bg-amber-50/50 dark:hover:bg-amber-900/10">
                                  <TableCell className="font-medium text-zinc-900 dark:text-white">
                                    {m.profile?.fantasy_name}
                                  </TableCell>
                                  <TableCell className="text-zinc-600 dark:text-zinc-400">
                                    {m.profile?.legal_name}
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant={mStatus.variant} className={mStatus.className}>
                                      {mStatus.label}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setSelectedMerchant(m)}
                                      title={t('dialogs.partnerDetail.viewDetails')}
                                      className="h-7 w-7 p-0 border-zinc-200 dark:border-zinc-700"
                                    >
                                      <Eye className="h-3 w-3" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                            {merchants.length === 0 && (
                              <TableRow>
                                <TableCell colSpan={4} className="text-center text-zinc-500 py-8">
                                  {t('dialogs.partnerDetail.noMerchants')}
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                        <PaginationControls
                          pagination={merchantsPagination}
                          onPageChange={(p) => setMerchantsPagination(prev => ({ ...prev, page: p }))}
                        />
                      </>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Sub-dialogs */}
      <PartnerUserDialog
        open={userDialogOpen}
        onOpenChange={setUserDialogOpen}
        onSuccess={loadUsers}
        item={editingUser}
        partnerId={item?._id || ''}
        partnerMerchants={merchants}
      />

      <ChangePasswordDialog
        open={!!changePasswordUser}
        onOpenChange={(open) => !open && setChangePasswordUser(null)}
        onSuccess={loadUsers}
        userId={changePasswordUser?._id || ''}
        userName={changePasswordUser?.name || changePasswordUser?.email || ''}
      />

      <MerchantDialog
        open={merchantDialogOpen}
        onOpenChange={setMerchantDialogOpen}
        onSuccess={loadMerchants}
        defaultOwner={item?._id}
      />

      <MerchantDetailDialog
        item={selectedMerchant}
        open={!!selectedMerchant}
        onOpenChange={(open) => !open && setSelectedMerchant(null)}
      />
    </>
  );
}
