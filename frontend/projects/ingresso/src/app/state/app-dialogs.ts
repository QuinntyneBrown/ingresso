import { Dialog } from '@angular/cdk/dialog';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AppRegistered, ConnectedApp, Profile, RegisteredApp, Tile, TileInput } from 'api';
import { modalDialogConfig } from 'components';
import { AddAppDialog, ADD_APP_TITLE_ID } from '../dialogs/add-app/add-app-dialog';
import {
  ClientSecretData,
  ClientSecretDialog,
  CLIENT_SECRET_TITLE_ID,
} from '../dialogs/client-secret/client-secret-dialog';
import { DeleteClientDialog, DELETE_CLIENT_TITLE_ID } from '../dialogs/delete-client/delete-client-dialog';
import { RotateSecretDialog, ROTATE_SECRET_TITLE_ID } from '../dialogs/rotate-secret/rotate-secret-dialog';
import { RevokeAccessDialog, REVOKE_ACCESS_TITLE_ID } from '../dialogs/revoke-access/revoke-access-dialog';
import { EditAppDialog, EDIT_APP_TITLE_ID } from '../dialogs/edit-app/edit-app-dialog';
import { EditProfileDialog, EDIT_PROFILE_TITLE_ID } from '../dialogs/edit-profile/edit-profile-dialog';
import {
  RegisterAppData,
  RegisterAppDialog,
  REGISTER_APP_TITLE_ID,
} from '../dialogs/register-app/register-app-dialog';
import { SignOutDialog, SIGN_OUT_TITLE_ID } from '../dialogs/sign-out/sign-out-dialog';
import { ResetLayoutDialog, RESET_LAYOUT_TITLE_ID } from '../dialogs/reset-layout/reset-layout-dialog';

/** Opens the add-app, edit-app, reset-layout, sign-out, register-app and client-secret dialogs from anywhere in the app. */
@Injectable({ providedIn: 'root' })
export class AppDialogs {
  private readonly dialog = inject(Dialog);

  openAdd(prefill?: Partial<TileInput>, trigger?: HTMLElement): void {
    this.dialog.open(
      AddAppDialog,
      modalDialogConfig({
        ariaLabelledBy: ADD_APP_TITLE_ID,
        restoreFocus: trigger ?? true,
        data: { prefill },
      }),
    );
  }

  openEdit(tile: Tile, trigger?: HTMLElement): void {
    this.dialog.open(
      EditAppDialog,
      modalDialogConfig({ ariaLabelledBy: EDIT_APP_TITLE_ID, restoreFocus: trigger ?? true, data: { tile } }),
    );
  }

  openResetLayout(trigger?: HTMLElement): void {
    this.dialog.open(
      ResetLayoutDialog,
      modalDialogConfig({ ariaLabelledBy: RESET_LAYOUT_TITLE_ID, restoreFocus: trigger ?? true }),
    );
  }

  openSignOut(trigger?: HTMLElement): void {
    this.dialog.open(
      SignOutDialog,
      modalDialogConfig({ ariaLabelledBy: SIGN_OUT_TITLE_ID, restoreFocus: trigger ?? true }),
    );
  }

  /** Register an app (L2-105); emits the registration when one was made, then completes. */
  openRegisterApp(trigger?: HTMLElement): Observable<AppRegistered | undefined> {
    return this.dialog.open<AppRegistered>(
      RegisterAppDialog,
      modalDialogConfig({ ariaLabelledBy: REGISTER_APP_TITLE_ID, restoreFocus: trigger ?? true }),
    ).closed;
  }

  /** Edit the signed-in person's profile (L2-117); emits the saved profile when it was saved, then completes. */
  openEditProfile(profile: Profile, trigger?: HTMLElement): Observable<Profile | undefined> {
    return this.dialog.open<Profile>(
      EditProfileDialog,
      modalDialogConfig({
        ariaLabelledBy: EDIT_PROFILE_TITLE_ID,
        restoreFocus: trigger ?? true,
        data: profile,
      }),
    ).closed;
  }

  /** Edit a registered app (L2-112); emits the saved app when it was saved, then completes. */
  openEditApp(app: RegisteredApp, trigger?: HTMLElement): Observable<AppRegistered | undefined> {
    return this.dialog.open<AppRegistered>(
      RegisterAppDialog,
      modalDialogConfig({
        ariaLabelledBy: REGISTER_APP_TITLE_ID,
        restoreFocus: trigger ?? true,
        data: { app } satisfies RegisterAppData,
      }),
    ).closed;
  }

  /** A new confidential app's client ID and secret, shown once (L2-106); completes when it closes. */
  openClientSecret(registered: AppRegistered, trigger?: HTMLElement, rotated = false): Observable<unknown> {
    return this.dialog.open(
      ClientSecretDialog,
      modalDialogConfig({
        ariaLabelledBy: CLIENT_SECRET_TITLE_ID,
        restoreFocus: trigger ?? true,
        data: { ...registered, rotated } satisfies ClientSecretData,
      }),
    ).closed;
  }

  /** Deletes a registered app once its name is typed (L2-115); emits true when it was deleted. */
  openDeleteClient(app: RegisteredApp, trigger?: HTMLElement): Observable<boolean | undefined> {
    return this.dialog.open<boolean>(
      DeleteClientDialog,
      modalDialogConfig({ ariaLabelledBy: DELETE_CLIENT_TITLE_ID, restoreFocus: trigger ?? true, data: app }),
    ).closed;
  }

  /** Asks, then rotates a confidential app's secret (L2-113); emits the new secret when it was rotated. */
  openRotateSecret(app: RegisteredApp, trigger?: HTMLElement): Observable<AppRegistered | undefined> {
    return this.dialog.open<AppRegistered>(
      RotateSecretDialog,
      modalDialogConfig({ ariaLabelledBy: ROTATE_SECRET_TITLE_ID, restoreFocus: trigger ?? true, data: app }),
    ).closed;
  }

  /** Asks, then revokes a connected app's access (L2-129); emits true when it was revoked. */
  openRevokeAccess(app: ConnectedApp, trigger?: HTMLElement): Observable<boolean | undefined> {
    return this.dialog.open<boolean>(
      RevokeAccessDialog,
      modalDialogConfig({ ariaLabelledBy: REVOKE_ACCESS_TITLE_ID, restoreFocus: trigger ?? true, data: app }),
    ).closed;
  }
}
