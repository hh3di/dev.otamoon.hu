import { Outlet } from 'react-router';

export default function _layout() {
  return (
    <section className="wrapper">
      <Outlet />
    </section>
  );
}
