
import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";

import {
  getMyProfile,
  updateMyProfile,
  changeMyPassword,
  updateStoredUser,
} from "../services/auth";

function Profile() {
  const [profile, setProfile] = useState(null);
  const [fullName, setFullName] = useState("");

  const [profileErrors, setProfileErrors] = useState({});
  const [passwordErrors, setPasswordErrors] = useState({});

  const [profileMessage, setProfileMessage] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [pageError, setPageError] = useState("");

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      try {
        const data = await getMyProfile();

        if (!active) return;

        setProfile(data.user);
        setFullName(data.user.full_name || "");
        updateStoredUser(data.user);
      } catch (error) {
        if (!active) return;

        setPageError(
          error.status === 401
            ? "Your session has expired. Please log in again."
            : error.message || "Could not load your profile."
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    loadProfile();

    return () => {
      active = false;
    };
  }, []);

  function validateFullName() {
    const trimmed = fullName.trim();
    const errors = {};

    if (!trimmed) {
      errors.full_name = "Full name is required.";
    } else if (trimmed.length < 3 || trimmed.length > 100) {
      errors.full_name =
        "Full name must be between 3 and 100 characters.";
    }

    setProfileErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleProfileSubmit(event) {
    event.preventDefault();

    setProfileMessage("");
    setPageError("");

    if (!validateFullName()) return;

    setSavingProfile(true);

    try {
      const data = await updateMyProfile(fullName.trim());

      setProfile(data.user);
      setFullName(data.user.full_name);
      updateStoredUser(data.user);
      setProfileMessage(data.message || "Profile updated successfully.");
      setProfileErrors({});
    } catch (error) {
      setProfileErrors(
        error.errors && Object.keys(error.errors).length
          ? error.errors
          : {
              full_name:
                error.status === 401
                  ? "Your session has expired. Please log in again."
                  : error.message || "Could not update your profile.",
            }
      );
    } finally {
      setSavingProfile(false);
    }
  }

  function validatePasswords() {
    const errors = {};

    if (!passwords.currentPassword) {
      errors.currentPassword = "Current password is required.";
    }

    if (!passwords.newPassword) {
      errors.newPassword = "New password is required.";
    } else if (passwords.newPassword.length < 8) {
      errors.newPassword =
        "Password must contain at least 8 characters.";
    } else if (
      new TextEncoder().encode(passwords.newPassword).length > 72
    ) {
      errors.newPassword =
        "Password must not exceed 72 UTF-8 bytes.";
    }

    if (!passwords.confirmPassword) {
      errors.confirmPassword = "Please confirm your new password.";
    } else if (passwords.newPassword !== passwords.confirmPassword) {
      errors.confirmPassword = "Passwords do not match.";
    }

    if (
      passwords.currentPassword &&
      passwords.newPassword &&
      passwords.currentPassword === passwords.newPassword
    ) {
      errors.newPassword =
        "New password must differ from the current password.";
    }

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function handlePasswordFieldChange(event) {
    const { name, value } = event.target;

    setPasswords((previous) => ({
      ...previous,
      [name]: value,
    }));

    setPasswordErrors((previous) => ({
      ...previous,
      [name]: "",
      ...(name === "newPassword" ? { confirmPassword: "" } : {}),
    }));

    setPasswordMessage("");
  }

  async function handlePasswordSubmit(event) {
    event.preventDefault();

    setPasswordMessage("");
    setPageError("");

    if (!validatePasswords()) return;

    setSavingPassword(true);

    try {
      const data = await changeMyPassword(passwords);

      setPasswordMessage(data.message || "Password changed successfully.");

      // Clear every password field after a successful change.
      setPasswords({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      setPasswordErrors({});
    } catch (error) {
      if (error.status === 429) {
        setPasswordErrors({
          currentPassword:
            "Too many failed attempts. Please try again later.",
        });
      } else if (error.status === 401) {
        setPasswordErrors({
          currentPassword: "Current password is incorrect.",
        });
      } else if (
        error.errors &&
        Object.keys(error.errors).length
      ) {
        setPasswordErrors(error.errors);
      } else {
        setPasswordErrors({
          currentPassword:
            error.message || "Could not change password.",
        });
      }
    } finally {
      setSavingPassword(false);
    }
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="profile-page">
          <p>Loading profile...</p>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />

      <main className="profile-page">
        <div className="profile-heading">
          <h1>My Profile</h1>
          <p>Manage your personal information and account password.</p>
        </div>

        {pageError && (
          <div className="profile-alert error" role="alert">
            {pageError}
          </div>
        )}

        {profile && (
          <>
            <section className="profile-card">
              <h2>Profile Information</h2>

              <dl className="profile-details">
                <div>
                  <dt>User ID</dt>
                  <dd>{profile.id}</dd>
                </div>

                <div>
                  <dt>Username</dt>
                  <dd>{profile.username}</dd>
                </div>

                <div>
                  <dt>Full Name</dt>
                  <dd>{profile.full_name}</dd>
                </div>

                <div>
                  <dt>Role</dt>
                  <dd>{profile.role}</dd>
                </div>
              </dl>
            </section>

            <section className="profile-card">
              <h2>Change Full Name</h2>

              {profileMessage && (
                <div className="profile-alert success" role="status">
                  {profileMessage}
                </div>
              )}

              <form onSubmit={handleProfileSubmit} noValidate>
                <div className="profile-field">
                  <label htmlFor="full_name">Full Name</label>

                  <input
                    id="full_name"
                    name="full_name"
                    type="text"
                    value={fullName}
                    minLength={3}
                    maxLength={100}
                    autoComplete="name"
                    onChange={(event) => {
                      setFullName(event.target.value);
                      setProfileErrors({});
                      setProfileMessage("");
                    }}
                    aria-invalid={Boolean(profileErrors.full_name)}
                    aria-describedby={
                      profileErrors.full_name ? "full-name-error" : undefined
                    }
                  />

                  {profileErrors.full_name && (
                    <p id="full-name-error" className="field-error">
                      {profileErrors.full_name}
                    </p>
                  )}
                </div>

                <p className="profile-hint">
                  Username and role cannot be changed here.
                </p>

                <button
                  className="btn btn-primary"
                  type="submit"
                  disabled={savingProfile}
                >
                  {savingProfile ? "Saving..." : "Save Full Name"}
                </button>
              </form>
            </section>

            <section className="profile-card">
              <h2>Change Password</h2>

              {passwordMessage && (
                <div className="profile-alert success" role="status">
                  {passwordMessage}
                </div>
              )}

              <form onSubmit={handlePasswordSubmit} noValidate>
                <div className="profile-field">
                  <label htmlFor="currentPassword">
                    Current Password
                  </label>

                  <input
                    id="currentPassword"
                    name="currentPassword"
                    type="password"
                    autoComplete="current-password"
                    value={passwords.currentPassword}
                    onChange={handlePasswordFieldChange}
                    aria-invalid={Boolean(passwordErrors.currentPassword)}
                  />

                  {passwordErrors.currentPassword && (
                    <p className="field-error">
                      {passwordErrors.currentPassword}
                    </p>
                  )}
                </div>

                <div className="profile-field">
                  <label htmlFor="newPassword">New Password</label>

                  <input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    autoComplete="new-password"
                    value={passwords.newPassword}
                    onChange={handlePasswordFieldChange}
                    aria-invalid={Boolean(passwordErrors.newPassword)}
                  />

                  {passwordErrors.newPassword && (
                    <p className="field-error">
                      {passwordErrors.newPassword}
                    </p>
                  )}

                  <p className="profile-hint">
                    Minimum 8 characters, maximum 72 UTF-8 bytes.
                  </p>
                </div>

                <div className="profile-field">
                  <label htmlFor="confirmPassword">
                    Confirm New Password
                  </label>

                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    value={passwords.confirmPassword}
                    onChange={handlePasswordFieldChange}
                    aria-invalid={Boolean(passwordErrors.confirmPassword)}
                  />

                  {passwordErrors.confirmPassword && (
                    <p className="field-error">
                      {passwordErrors.confirmPassword}
                    </p>
                  )}
                </div>

                <button
                  className="btn btn-primary"
                  type="submit"
                  disabled={savingPassword}
                >
                  {savingPassword ? "Changing..." : "Change Password"}
                </button>
              </form>
            </section>
          </>
        )}
      </main>
    </>
  );
}

export default Profile;
