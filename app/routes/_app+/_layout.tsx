import { Outlet } from 'react-router';
import Navbar from '~/components/ui/Navbar';

export default function _layout() {
  return (
    <main id="navroot">
      <Navbar />
      <section className="wrapper">
        <Outlet />
      </section>
    </main>
  );
}
