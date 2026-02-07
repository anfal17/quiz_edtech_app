import { useState, useEffect } from 'react';
import {
    Search, Users, Mail, Calendar, Shield,
    MoreVertical, Eye, Ban, CheckCircle
} from 'lucide-react';
import { Button, Card, Badge, Modal } from '../../components/ui';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function ManageUsers() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        total: 0,
        active: 0,
        inactive: 0,
        banned: 0 // We might not distinguish effectively yet, but let's keep the key
    });
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        pages: 1
    });

    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [selectedUser, setSelectedUser] = useState(null);
    const [showUserModal, setShowUserModal] = useState(false);

    const fetchStats = async () => {
        try {
            const data = await adminAPI.getStats();
            setStats({
                total: data.totalUsers || 0,
                active: data.activeUsers || 0,
                inactive: data.inactiveUsers || 0,
                banned: 0 // API doesn't separate banned vs inactive yet
            });
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        }
    };

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const params = {
                page: pagination.page,
                limit: pagination.limit,
                search: searchQuery,
            };

            if (filterStatus !== 'all') {
                params.status = filterStatus; // 'active', 'inactive', 'banned'
            }

            const data = await adminAPI.getUsers(params);
            setUsers(data.users);
            setPagination(prev => ({
                ...prev,
                total: data.pagination.total,
                pages: data.pagination.pages
            }));
        } catch (error) {
            console.error('Failed to fetch users:', error);
            toast.error('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchUsers();
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery, filterStatus, pagination.page]);

    const handleToggleStatus = async (user) => {
        try {
            await adminAPI.toggleUserStatus(user._id);
            toast.success(`User ${user.isActive ? 'deactivated' : 'activated'} successfully`);
            fetchUsers();
            fetchStats();
            if (selectedUser && selectedUser._id === user._id) {
                setSelectedUser(prev => ({ ...prev, isActive: !prev.isActive, status: !prev.isActive ? 'active' : 'inactive' }));
            }
        } catch (error) {
            console.error('Failed to toggle status:', error);
            toast.error('Failed to update user status');
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-[var(--text)]">Manage Users</h1>
                <p className="text-[var(--text-secondary)]">View and manage user accounts.</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Card className="text-center">
                    <div className="text-2xl font-bold text-[var(--text)]">{stats.total}</div>
                    <p className="text-sm text-[var(--text-secondary)]">Total Users</p>
                </Card>
                <Card className="text-center">
                    <div className="text-2xl font-bold text-success-400">{stats.active}</div>
                    <p className="text-sm text-[var(--text-secondary)]">Active</p>
                </Card>
                <Card className="text-center">
                    <div className="text-2xl font-bold text-warning-400">{stats.inactive}</div>
                    <p className="text-sm text-[var(--text-secondary)]">Inactive</p>
                </Card>
                {/* 
                <Card className="text-center">
                    <div className="text-2xl font-bold text-error-400">{stats.banned}</div>
                    <p className="text-sm text-[var(--text-secondary)]">Banned</p>
                </Card>
                */}
            </div>

            {/* Filters */}
            <Card>
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)]" />
                        <input
                            type="text"
                            placeholder="Search users by name or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="
                w-full pl-12 pr-4 py-2.5 rounded-xl
                bg-[var(--surface-hover)] border border-[var(--border)]
                text-[var(--text)] placeholder:text-[var(--text-secondary)]
                focus:outline-none focus:ring-2 focus:ring-primary-500
              "
                        />
                    </div>

                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="
              px-4 py-2.5 rounded-xl
              bg-[var(--surface-hover)] border border-[var(--border)]
              text-[var(--text)]
              focus:outline-none focus:ring-2 focus:ring-primary-500
            "
                    >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                </div>
            </Card>

            {/* Users Table */}
            <Card padding="none">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-[var(--border)]">
                                <th className="text-left py-4 px-6 text-sm font-semibold text-[var(--text-secondary)]">User</th>
                                <th className="text-left py-4 px-6 text-sm font-semibold text-[var(--text-secondary)]">Level</th>
                                <th className="text-left py-4 px-6 text-sm font-semibold text-[var(--text-secondary)]">XP</th>
                                <th className="text-left py-4 px-6 text-sm font-semibold text-[var(--text-secondary)]">Joined</th>
                                <th className="text-left py-4 px-6 text-sm font-semibold text-[var(--text-secondary)]">Status</th>
                                <th className="text-right py-4 px-6 text-sm font-semibold text-[var(--text-secondary)]">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="py-8 text-center">
                                        <div className="inline-block animate-spin w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full" />
                                    </td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="py-12 text-center text-[var(--text-secondary)]">
                                        No users found
                                    </td>
                                </tr>
                            ) : (
                                users.map((user) => (
                                    <tr key={user._id} className="border-b border-[var(--border)] hover:bg-[var(--surface-hover)]">
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-xl">
                                                    {user.avatar || '👤'}
                                                </div>
                                                <div>
                                                    <h3 className="font-medium text-[var(--text)]">{user.name}</h3>
                                                    <p className="text-sm text-[var(--text-secondary)]">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <Badge variant="secondary">Level {user.level || 1}</Badge>
                                        </td>
                                        <td className="py-4 px-6 text-[var(--text)]">{(user.xp || 0).toLocaleString()}</td>
                                        <td className="py-4 px-6 text-[var(--text-secondary)]">
                                            {new Date(user.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="py-4 px-6">
                                            <Badge
                                                variant={user.isActive ? 'success' : 'error'}
                                            >
                                                {user.isActive ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => { setSelectedUser(user); setShowUserModal(true); }}
                                                    className="p-2 rounded-lg hover:bg-[var(--surface)] text-[var(--text-secondary)] hover:text-primary-400"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                                {user.isActive ? (
                                                    <button
                                                        onClick={() => handleToggleStatus(user)}
                                                        className="p-2 rounded-lg hover:bg-[var(--surface)] text-[var(--text-secondary)] hover:text-error-400"
                                                        title="Deactivate/Ban"
                                                    >
                                                        <Ban size={18} />
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleToggleStatus(user)}
                                                        className="p-2 rounded-lg hover:bg-[var(--surface)] text-[var(--text-secondary)] hover:text-success-400"
                                                        title="Activate"
                                                    >
                                                        <CheckCircle size={18} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination (Simple) */}
                {!loading && pagination.pages > 1 && (
                    <div className="p-4 border-t border-[var(--border)] flex justify-center gap-2">
                        <Button
                            variant="outline"
                            disabled={pagination.page === 1}
                            onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                        >Previous</Button>
                        <span className="flex items-center px-4 text-sm text-[var(--text-secondary)]">
                            Page {pagination.page} of {pagination.pages}
                        </span>
                        <Button
                            variant="outline"
                            disabled={pagination.page === pagination.pages}
                            onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                        >Next</Button>
                    </div>
                )}
            </Card>

            {/* User Details Modal */}
            <Modal
                isOpen={showUserModal}
                onClose={() => { setShowUserModal(false); setSelectedUser(null); }}
                title="User Details"
                size="md"
            >
                {selectedUser && (
                    <div className="space-y-6">
                        {/* User Header */}
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-3xl">
                                {selectedUser.avatar || '👤'}
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-[var(--text)]">{selectedUser.name}</h3>
                                <p className="text-[var(--text-secondary)]">{selectedUser.email}</p>
                            </div>
                            <Badge
                                variant={selectedUser.isActive ? 'success' : 'error'}
                                className="ml-auto"
                            >
                                {selectedUser.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-4">
                            <div className="p-4 rounded-xl bg-[var(--surface-hover)] text-center">
                                <div className="text-xl font-bold text-secondary-400">{(selectedUser.xp || 0).toLocaleString()}</div>
                                <p className="text-sm text-[var(--text-secondary)]">Total XP</p>
                            </div>
                            <div className="p-4 rounded-xl bg-[var(--surface-hover)] text-center">
                                <div className="text-xl font-bold text-primary-400">Level {selectedUser.level || 1}</div>
                                <p className="text-sm text-[var(--text-secondary)]">Current Level</p>
                            </div>
                            <div className="p-4 rounded-xl bg-[var(--surface-hover)] text-center">
                                <div className="text-xl font-bold text-success-400">
                                    {new Date(selectedUser.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                                </div>
                                <p className="text-sm text-[var(--text-secondary)]">Joined</p>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 pt-4 border-t border-[var(--border)]">
                            <Button variant="outline" fullWidth onClick={() => { setShowUserModal(false); setSelectedUser(null); }}>
                                Close
                            </Button>
                            {selectedUser.isActive ? (
                                <Button
                                    variant="primary"
                                    fullWidth
                                    className="bg-error-500 hover:bg-error-600"
                                    leftIcon={<Ban size={16} />}
                                    onClick={() => handleToggleStatus(selectedUser)}
                                >
                                    Ban User
                                </Button>
                            ) : (
                                <Button
                                    variant="primary"
                                    fullWidth
                                    className="bg-success-500 hover:bg-success-600"
                                    leftIcon={<CheckCircle size={16} />}
                                    onClick={() => handleToggleStatus(selectedUser)}
                                >
                                    Activate User
                                </Button>
                            )}
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
