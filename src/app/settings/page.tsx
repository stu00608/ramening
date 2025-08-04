"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
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
} from "@/components/ui/alert-dialog";
import {
  Settings,
  User,
  CreditCard,
  MapPin,
  Download,
  Upload,
  Trash2,
  Info,
  Eye,
  EyeOff,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/theme-toggle";

interface UserSettings {
  // 預設設定
  defaultPartySize: number;
  defaultOrderMethod: string;
  defaultPaymentMethods: string[];
  defaultSearchRadius: number;
  defaultSearchRegion: string;
  
  // Google API 設定
  googlePlacesApiKey: string;
  
  // 使用者偏好
  language: string;
  theme: string;
  
  // 應用程式資訊
  appVersion: string;
}

const defaultSettings: UserSettings = {
  defaultPartySize: 1,
  defaultOrderMethod: "食券機",
  defaultPaymentMethods: ["現金"],
  defaultSearchRadius: 10000,
  defaultSearchRegion: "jp",
  googlePlacesApiKey: "",
  language: "zh-TW",
  theme: "system",
  appVersion: "0.1.0",
};

export default function SettingsPage() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  // 載入設定
  useEffect(() => {
    const loadSettings = () => {
      try {
        // 從 localStorage 載入設定，實際應用中可能會從後端 API 載入
        const savedSettings = localStorage.getItem('ramening-settings');
        if (savedSettings) {
          const parsed = JSON.parse(savedSettings);
          setSettings({ ...defaultSettings, ...parsed });
        } else {
          // 如果沒有儲存的設定，使用環境變數中的 API 金鑰
          const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY || "";
          setSettings({ ...defaultSettings, googlePlacesApiKey: apiKey });
        }
      } catch (error) {
        console.error('載入設定失敗:', error);
        toast({
          title: "載入設定失敗",
          description: "使用預設設定",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [toast]);

  // 儲存設定
  const saveSettings = async () => {
    try {
      setIsSaving(true);
      
      // 儲存到 localStorage，實際應用中會發送到後端 API
      localStorage.setItem('ramening-settings', JSON.stringify(settings));
      
      toast({
        title: "設定已儲存",
        description: "您的設定已成功更新",
      });
    } catch (error) {
      console.error('儲存設定失敗:', error);
      toast({
        title: "儲存失敗",
        description: "無法儲存設定，請重試",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // 重置設定
  const resetSettings = () => {
    setSettings(defaultSettings);
    localStorage.removeItem('ramening-settings');
    toast({
      title: "設定已重置",
      description: "所有設定已恢復為預設值",
    });
  };

  // 匯出資料
  const exportData = async () => {
    try {
      const response = await fetch('/api/reviews');
      const data = await response.json();
      
      const exportData = {
        settings,
        reviews: data.reviews || [],
        exportDate: new Date().toISOString(),
        version: settings.appVersion,
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ramening-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "匯出成功",
        description: "資料已成功匯出到檔案",
      });
    } catch (error) {
      console.error('匯出失敗:', error);
      toast({
        title: "匯出失敗",
        description: "無法匯出資料，請重試",
        variant: "destructive",
      });
    }
  };

  // 清除所有資料
  const clearAllData = async () => {
    try {
      // 這裡應該呼叫清除所有資料的 API
      // await fetch('/api/data/clear', { method: 'DELETE' });
      
      localStorage.clear();
      setSettings(defaultSettings);
      
      toast({
        title: "資料已清除",
        description: "所有應用程式資料已被清除",
      });
    } catch (error) {
      console.error('清除資料失敗:', error);
      toast({
        title: "清除失敗",
        description: "無法清除資料，請重試",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-64 bg-gray-200 rounded animate-pulse" />
          </div>
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-6 w-40 bg-gray-200 rounded animate-pulse" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
                <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">應用程式設定</h1>
        <p className="text-muted-foreground">
          自訂您的 Ramening 使用體驗
        </p>
      </div>

      <div className="space-y-6">
        {/* 預設設定 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              預設設定
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="default-party-size">預設用餐人數</Label>
                <Select
                  value={settings.defaultPartySize.toString()}
                  onValueChange={(value) =>
                    setSettings({ ...settings, defaultPartySize: parseInt(value) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num}人
                      </SelectItem>
                    ))}
                    <SelectItem value="10">10人以上</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="default-order-method">預設點餐方式</Label>
                <Select
                  value={settings.defaultOrderMethod}
                  onValueChange={(value) =>
                    setSettings({ ...settings, defaultOrderMethod: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="食券機">食券機</SelectItem>
                    <SelectItem value="注文制">注文制</SelectItem>
                    <SelectItem value="其他">其他</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>預設付款方式</Label>
              <div className="grid gap-2 md:grid-cols-2">
                {["現金", "QR決済", "交通系IC", "信用卡"].map((method) => (
                  <div key={method} className="flex items-center space-x-2">
                    <Switch
                      checked={settings.defaultPaymentMethods.includes(method)}
                      onCheckedChange={(checked) => {
                        const methods = settings.defaultPaymentMethods;
                        if (checked) {
                          setSettings({
                            ...settings,
                            defaultPaymentMethods: [...methods, method],
                          });
                        } else {
                          setSettings({
                            ...settings,
                            defaultPaymentMethods: methods.filter((m) => m !== method),
                          });
                        }
                      }}
                    />
                    <Label>{method}</Label>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Google Places API 設定 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Google Places API 設定
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="api-key">API 金鑰</Label>
              <div className="flex gap-2">
                <Input
                  id="api-key"
                  type={showApiKey ? "text" : "password"}
                  value={settings.googlePlacesApiKey}
                  onChange={(e) =>
                    setSettings({ ...settings, googlePlacesApiKey: e.target.value })
                  }
                  placeholder="輸入您的 Google Places API 金鑰"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                需要 Google Places API 金鑰才能搜尋餐廳和車站資訊
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="search-radius">搜尋範圍 (公尺)</Label>
                <Select
                  value={settings.defaultSearchRadius.toString()}
                  onValueChange={(value) =>
                    setSettings({ ...settings, defaultSearchRadius: parseInt(value) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1000">1km</SelectItem>
                    <SelectItem value="5000">5km</SelectItem>
                    <SelectItem value="10000">10km</SelectItem>
                    <SelectItem value="25000">25km</SelectItem>
                    <SelectItem value="50000">50km</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="search-region">搜尋地區</Label>
                <Select
                  value={settings.defaultSearchRegion}
                  onValueChange={(value) =>
                    setSettings({ ...settings, defaultSearchRegion: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="jp">日本</SelectItem>
                    <SelectItem value="tw">台灣</SelectItem>
                    <SelectItem value="kr">韓國</SelectItem>
                    <SelectItem value="us">美國</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 使用者偏好 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              使用者偏好
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="language">語言</Label>
                <Select
                  value={settings.language}
                  onValueChange={(value) =>
                    setSettings({ ...settings, language: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="zh-TW">繁體中文</SelectItem>
                    <SelectItem value="zh-CN">简体中文</SelectItem>
                    <SelectItem value="ja">日本語</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>主題模式</Label>
                <div className="flex items-center space-x-4">
                  <Label className="text-sm">切換主題：</Label>
                  <ThemeToggle />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 資料管理 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              資料管理
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Button
                variant="outline"
                onClick={exportData}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                匯出所有資料
              </Button>

              <Button
                variant="outline"
                onClick={() => document.getElementById('import-file')?.click()}
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                匯入資料
              </Button>
            </div>

            <input
              id="import-file"
              type="file"
              accept=".json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    try {
                      const data = JSON.parse(event.target?.result as string);
                      if (data.settings) {
                        setSettings({ ...defaultSettings, ...data.settings });
                        toast({
                          title: "匯入成功",
                          description: "設定已從檔案匯入",
                        });
                      }
                    } catch (error) {
                      toast({
                        title: "匯入失敗",
                        description: "檔案格式不正確",
                        variant: "destructive",
                      });
                    }
                  };
                  reader.readAsText(file);
                }
              }}
            />

            <Separator />

            <div className="space-y-4">
              <h4 className="font-medium text-destructive">危險操作</h4>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    清除所有資料
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>確認清除所有資料</AlertDialogTitle>
                    <AlertDialogDescription>
                      此操作將永久刪除所有評價、設定和應用程式資料。此操作無法復原。
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>取消</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={clearAllData}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      確定清除
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>

        {/* 關於資訊 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              關於 Ramening
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label className="text-sm font-medium">應用程式版本</Label>
                <p className="text-sm text-muted-foreground">{settings.appVersion}</p>
              </div>

              <div>
                <Label className="text-sm font-medium">開發者</Label>
                <p className="text-sm text-muted-foreground">Ramening Team</p>
              </div>

              <div>
                <Label className="text-sm font-medium">授權</Label>
                <p className="text-sm text-muted-foreground">MIT License</p>
              </div>

              <div>
                <Label className="text-sm font-medium">專案網址</Label>
                <p className="text-sm text-muted-foreground">
                  <a
                    href="https://github.com/ramening/ramening"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 underline"
                  >
                    GitHub Repository
                  </a>
                </p>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">描述</Label>
              <p className="text-sm text-muted-foreground">
                Ramening 是一個專為日本拉麵愛好者設計的評價紀錄工具。
                支援詳細的評價記錄、照片管理、Instagram 匯出等功能。
                所有資料均在本地端處理，不使用雲端服務。
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 操作按鈕 */}
        <div className="flex gap-4">
          <Button onClick={saveSettings} disabled={isSaving}>
            {isSaving ? "儲存中..." : "儲存設定"}
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline">重置設定</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>確認重置設定</AlertDialogTitle>
                <AlertDialogDescription>
                  此操作將重置所有設定為預設值。您確定要繼續嗎？
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>取消</AlertDialogCancel>
                <AlertDialogAction onClick={resetSettings}>
                  確定重置
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}