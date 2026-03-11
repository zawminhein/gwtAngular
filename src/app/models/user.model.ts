export interface Role {
  syskey: string;
  checkstatus: boolean;
  t1: string;
  t2: string;
  t3: string;
  userSysKey: string;
  userid: string;
  username: string;
}

export interface User {
  u5syskey: string;
  userid: string;
  username: string;
  password?: string;
  confirmPassword?: string;
  rolelist: { syskey: string }[];
  u12syskey?: string;
}

export interface Pager {
  page: number;
  size: number;
  total: number;
}