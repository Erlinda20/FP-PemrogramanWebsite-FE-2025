import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import { useEffect, useState } from "react";
import api from "@/api/axios";
import toast from "react-hot-toast";
import { AxiosError } from "axios";
import Navbar from "@/components/ui/layout/Navbar";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import iconGamepad from "../assets/images/icon-gamepad.svg";
import iconPlay from "../assets/images/icon-play.svg";
import iconHeart from "../assets/images/icon-heart.svg";
import iconEdit from "../assets/images/icon-edit.svg";
import iconLock from "../assets/images/icon-lock.svg";
import iconLogout from "../assets/images/icon-logout.svg";

export default function ProfilePage() {
  const navigate = useNavigate();
  const logoutAction = useAuthStore((state) => state.logout);
  const setUser = useAuthStore((state) => state.setUser);

  const [gamesCreated, setGamesCreated] = useState(0);

  const user = useAuthStore((state) => state.user);

  const [loading, setLoading] = useState(true);

  // Edit Profile Modal
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editUsername, setEditUsername] = useState("");
  const [editProfilePicture, setEditProfilePicture] = useState<File | null>(null);
  const [editProfilePicturePreview, setEditProfilePicturePreview] = useState<string | null>(null);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Change Password Modal
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    const fetchGamesCreated = async () => {
      try {
        setLoading(true);
        const response = await api.get("/api/auth/me/game");
        setGamesCreated(response.data.meta.total);
      } catch (error) {
        console.error("Failed to fetch games created:", error);
        toast.error("Failed to fetch games created.");
      } finally {
        setLoading(false);
      }
    };
    fetchGamesCreated();
  }, []);

  // Initialize edit form when modal opens
  useEffect(() => {
    if (isEditProfileOpen && user) {
      setEditUsername(user.username || "");
      setEditProfilePicture(null);
      setEditProfilePicturePreview(null);
    }
  }, [isEditProfileOpen, user]);

  const handleOpenEditProfile = () => {
    setIsEditProfileOpen(true);
  };

  const handleCloseEditProfile = () => {
    setIsEditProfileOpen(false);
    setEditUsername("");
    setEditProfilePicture(null);
    setEditProfilePicturePreview(null);
  };

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setEditProfilePicture(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditProfilePicturePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateProfile = async () => {
    if (!editUsername.trim()) {
      toast.error("Username is required");
      return;
    }

    setIsUpdatingProfile(true);

    try {
      const formData = new FormData();
      formData.append("username", editUsername);

      if (editProfilePicture) {
        formData.append("profile_picture", editProfilePicture);
      }

      const response = await api.patch("/api/auth/me", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Update user in store
      const meResponse = await api.get("/api/auth/me");
      setUser(meResponse.data.data);

      toast.success("Profile updated successfully!");
      handleCloseEditProfile();
    } catch (err) {
      console.error("Failed to update profile:", err);
      const error = err as AxiosError<{ message?: string }>;
      const errorMessage =
        error.response?.data?.message || "Failed to update profile. Please try again.";
      toast.error(errorMessage);
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleOpenChangePassword = () => {
    setIsChangePasswordOpen(true);
  };

  const handleCloseChangePassword = () => {
    setIsChangePasswordOpen(false);
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      toast.error("All fields are required");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New password and confirm password do not match");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setIsChangingPassword(true);

    try {
      await api.patch("/api/auth/me/password", {
        old_password: oldPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });

      toast.success("Password changed successfully!");
      handleCloseChangePassword();
    } catch (err) {
      console.error("Failed to change password:", err);
      const error = err as AxiosError<{ message?: string }>;
      const errorMessage =
        error.response?.data?.message || "Failed to change password. Please try again.";
      toast.error(errorMessage);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleLogout = () => {
    logoutAction();
    navigate("/login");
  };

  return (
    <div>
      <Navbar />

      {user && (
        <main className="max-w-4xl mx-auto py-10 px-6">
          <div className="pb-2 mb-6">
            <Typography variant="h2">Profile</Typography>
          </div>
          <div className="flex flex-col gap-5">
            <Card>
              <CardContent className="flex flex-col md:flex-row items-center gap-6">
                <Avatar className="w-24 h-24">
                  <AvatarImage
                    src={
                      user?.profile_picture
                        ? `${import.meta.env.VITE_API_URL}/${user.profile_picture}`
                        : undefined
                    }
                    alt="User Avatar"
                  />
                  <AvatarFallback className="text-4xl">
                    {user?.username?.charAt(0)?.toUpperCase() ?? "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="text-center md:text-left">
                  <Typography variant="h3">
                    {user.username || "Username"}
                  </Typography>
                  <Typography variant="muted" className="mt-1">
                    {user.email}
                  </Typography>
                </div>
              </CardContent>
            </Card>

            <section className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <Card>
                <CardContent className="flex items-center gap-4">
                  <div className="bg-blue-100 p-3 rounded-xl">
                    <img
                      src={iconGamepad}
                      alt="Games Created"
                      className="w-6 h-6"
                    />
                  </div>
                  <div>
                    <Typography variant="h3">
                      {loading ? "..." : gamesCreated}
                    </Typography>
                    <Typography variant="muted">Games Created</Typography>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center gap-4">
                  <div className="bg-purple-100 p-3 rounded-xl">
                    <img src={iconPlay} alt="Total Plays" className="w-6 h-6" />
                  </div>
                  <div>
                    <Typography variant="h3">
                      {user.total_game_played}
                    </Typography>
                    <Typography variant="muted">Total Plays</Typography>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center gap-4">
                  <div className="bg-yellow-100 p-3 rounded-xl">
                    <img
                      src={iconHeart}
                      alt="Total Favorites"
                      className="w-6 h-6"
                    />
                  </div>
                  <div>
                    <Typography variant="h3">
                      {user.total_game_liked}
                    </Typography>
                    <Typography variant="muted">Total Favorites</Typography>
                  </div>
                </CardContent>
              </Card>
            </section>

            <Card>
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  onClick={handleOpenEditProfile}
                  variant="ghost"
                  className="w-full justify-start gap-4 px-4 h-12"
                >
                  <img src={iconEdit} alt="" className="w-5 h-5" />
                  <span>Edit Profile</span>
                </Button>
                <Button
                  onClick={handleOpenChangePassword}
                  variant="ghost"
                  className="w-full justify-start gap-4 px-4 h-12"
                >
                  <img src={iconLock} alt="" className="w-5 h-5" />
                  <span>Change Password</span>
                </Button>
                <Button
                  onClick={handleLogout}
                  variant="ghost"
                  className="w-full justify-start gap-4 px-4 h-12 text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <img src={iconLogout} alt="" className="w-5 h-5" />
                  <span>Logout</span>
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      )}

      {/* Edit Profile Dialog */}
      <Dialog open={isEditProfileOpen} onOpenChange={setIsEditProfileOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>
              Update your profile information. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={editUsername}
                onChange={(e) => setEditUsername(e.target.value)}
                placeholder="Enter your username"
                disabled={isUpdatingProfile}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-picture">Profile Picture</Label>
              <Input
                id="profile-picture"
                type="file"
                accept="image/*"
                onChange={handleProfilePictureChange}
                disabled={isUpdatingProfile}
              />
              {editProfilePicturePreview && (
                <div className="mt-2">
                  <img
                    src={editProfilePicturePreview}
                    alt="Preview"
                    className="w-24 h-24 rounded-full object-cover"
                  />
                </div>
              )}
              {!editProfilePicturePreview && user?.profile_picture && (
                <div className="mt-2">
                  <img
                    src={`${import.meta.env.VITE_API_URL}/${user.profile_picture}`}
                    alt="Current"
                    className="w-24 h-24 rounded-full object-cover"
                  />
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCloseEditProfile}
              disabled={isUpdatingProfile}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateProfile} disabled={isUpdatingProfile}>
              {isUpdatingProfile ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={isChangePasswordOpen} onOpenChange={setIsChangePasswordOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Enter your current password and new password to change it.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="old-password">Current Password</Label>
              <Input
                id="old-password"
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="Enter your current password"
                disabled={isChangingPassword}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter your new password"
                disabled={isChangingPassword}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your new password"
                disabled={isChangingPassword}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCloseChangePassword}
              disabled={isChangingPassword}
            >
              Cancel
            </Button>
            <Button onClick={handleChangePassword} disabled={isChangingPassword}>
              {isChangingPassword ? "Changing..." : "Change Password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
