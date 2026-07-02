import { MobileNav } from '../MobileNav';
import { Route, Switch } from 'wouter';

export default function MobileNavExample() {
  return (
    <div className="h-screen flex flex-col">
      <div className="flex-1 p-4 overflow-auto pb-20">
        <Switch>
          <Route path="/">
            <div className="text-center">Dashboard Content</div>
          </Route>
          <Route path="/entry">
            <div className="text-center">Entry Content</div>
          </Route>
          <Route path="/analytics">
            <div className="text-center">Analytics Content</div>
          </Route>
          <Route path="/reports">
            <div className="text-center">Reports Content</div>
          </Route>
        </Switch>
      </div>
      <MobileNav />
    </div>
  );
}
