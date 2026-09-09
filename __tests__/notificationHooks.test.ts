import AsyncStorage from '@react-native-async-storage/async-storage';
import axiosConfig from '../src/utils/axiosConfig';
import {
    getUnreadNotificationCount,
    markNotificationsRead,
} from '../src/hooks/useNotificationList';

jest.mock('@react-native-async-storage/async-storage', () => ({
    getItem: jest.fn(),
    multiGet: jest.fn(),
    setItem: jest.fn(),
}));

jest.mock('../src/utils/axiosConfig', () => ({
    post: jest.fn(),
}));

describe('notification read state', () => {
    it('counts only unread notifications', () => {
        expect(
            getUnreadNotificationCount([
                {id: 1, is_read: 0},
                {id: 2, is_read: '0'},
                {id: 3, is_read: 1},
                {id: 4, is_read: '1'},
            ]),
        ).toBe(2);
    });

    it('persists viewed notification ids with the current user scope', async () => {
        (AsyncStorage.multiGet as jest.Mock).mockResolvedValue([
            ['userType', '9'],
            ['userid', '42'],
            ['branch_id', '3'],
        ]);
        (axiosConfig.post as jest.Mock).mockResolvedValue({
            status: 200,
            data: {result: true},
        });

        await markNotificationsRead([10, 11]);

        expect(axiosConfig.post).toHaveBeenCalledWith(
            '?action=mobile-notification-read',
            {
                notification_ids: [10, 11],
                role: 9,
                user_id: 42,
                branch_id: 3,
            },
        );
    });

    it('accepts a legacy success response from the PHP API', async () => {
        (AsyncStorage.multiGet as jest.Mock).mockResolvedValue([
            ['userType', '9'],
            ['userid', '42'],
            ['branch_id', '3'],
        ]);
        (axiosConfig.post as jest.Mock).mockResolvedValue({
            status: 200,
            data: '{"success":1}',
        });

        await expect(markNotificationsRead([10])).resolves.toBeUndefined();
    });

    it('does not fail when the deployed API returns an empty 200 response', async () => {
        (AsyncStorage.multiGet as jest.Mock).mockResolvedValue([
            ['userType', '9'],
            ['userid', '42'],
            ['branch_id', '3'],
        ]);
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue('[]');
        (axiosConfig.post as jest.Mock).mockResolvedValue({status: 200, data: ''});

        await expect(markNotificationsRead([12])).resolves.toBeUndefined();
        expect(AsyncStorage.setItem).toHaveBeenCalledWith(
            'read_notification_ids',
            '[12]',
        );
    });
});
