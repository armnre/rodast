import { Tabs, TabsContent, TabsList, TabsTrigger } from '@project/components/ui/tabs';
import AdminDashboard from '../components/admin/AdminDashboard';
import AdminUsers from '../components/admin/AdminUsers';
import AdminSettings from '../components/admin/AdminSettings';
import AdminAudit from '../components/admin/AdminAudit';

export default function Admin() {
  return (
    <div className="space-y-4 pt-2">
      <h1 className="text-2xl font-black">پنل مدیریت</h1>
      <Tabs defaultValue="dash" dir="rtl">
        <TabsList className="w-full justify-start overflow-x-auto rounded-2xl">
          <TabsTrigger value="dash">داشبورد</TabsTrigger>
          <TabsTrigger value="users">کاربران</TabsTrigger>
          <TabsTrigger value="settings">تنظیمات</TabsTrigger>
          <TabsTrigger value="audit">بررسی و لاگ</TabsTrigger>
        </TabsList>
        <TabsContent value="dash"><AdminDashboard /></TabsContent>
        <TabsContent value="users"><AdminUsers /></TabsContent>
        <TabsContent value="settings"><AdminSettings /></TabsContent>
        <TabsContent value="audit"><AdminAudit /></TabsContent>
      </Tabs>
    </div>
  );
}
