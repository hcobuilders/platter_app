"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { createUser, updateUser } from "./actions";
import { ROLE_LABEL } from "@/components/AccountMenu";

export type UserOption = {
  id: string;
  name: string;
  email: string;
  role: string;
};

const ROLE_OPTIONS = Object.keys(ROLE_LABEL);

// One query-param-driven modal (?user=new / ?user=<id>) handles both
// create and edit, matching FlagModal's convention. Password is required
// on create; on edit it's optional and left blank to keep the existing
// one — updateUser only rehashes when a value is actually submitted.
export function UserModal({ users }: { users: UserOption[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userParam = searchParams.get("user");
  if (!userParam) return null;

  const editing = userParam !== "new" ? users.find((u) => u.id === userParam) : undefined;
  if (userParam !== "new" && !editing) return null;

  function close() {
    router.push("?view=users");
  }

  return (
    <div
      className="cmdk-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className="cmdk" style={{ maxWidth: 420 }} onMouseDown={(e) => e.stopPropagation()}>
        <div style={{ padding: "16px 18px 0" }}>
          <div className="lbl" style={{ marginBottom: 8 }}>
            {editing ? "Edit user" : "New user"}
          </div>
        </div>
        <form
          action={async (fd) => {
            if (editing) await updateUser(editing.id, fd);
            else await createUser(fd);
            close();
          }}
          className="flex flex-col gap-3"
          style={{ padding: 18 }}
        >
          <input className="fld" name="name" placeholder="Name" defaultValue={editing?.name} required autoFocus />
          <input className="fld" name="email" type="email" placeholder="Email" defaultValue={editing?.email} required />
          <select className="fld" name="role" defaultValue={editing?.role ?? "estimator"}>
            {ROLE_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABEL[r]}
              </option>
            ))}
          </select>
          <div>
            <input
              className="fld"
              name="password"
              type="password"
              placeholder={editing ? "New password (leave blank to keep unchanged)" : "Password"}
              required={!editing}
            />
          </div>
          <div className="flex gap-2 mt-2">
            <button className="btn btn--acc" type="submit">
              {editing ? "Save changes" : "Save user"}
            </button>
            <button className="btn btn--gh" type="button" onClick={close}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
