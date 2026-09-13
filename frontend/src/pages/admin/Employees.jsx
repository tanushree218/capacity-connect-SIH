import Layout from "@/components/Layout";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function Employees() {
  const [emps, setEmps] = useState([]);
  useEffect(() => { api.get("/users?role=employee").then((r) => setEmps(r.data)); }, []);

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <div className="text-xs uppercase tracking-widest text-[#008DDA] font-bold">Workforce</div>
          <h1 className="font-display text-3xl font-extrabold text-[#0B192C]">Employee Directory</h1>
        </div>
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Designation</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {emps.map((e) => (
                <TableRow key={e.id} data-testid={`emp-row-${e.id}`}>
                  <TableCell className="font-semibold text-[#0B192C]">{e.name}</TableCell>
                  <TableCell className="text-sm text-slate-600">{e.email}</TableCell>
                  <TableCell><Badge variant="outline">{e.department}</Badge></TableCell>
                  <TableCell className="text-sm">{e.designation}</TableCell>
                  <TableCell className="text-right">
                    <Link to={`/admin/employee/${e.id}`}>
                      <Button variant="link" size="sm" className="text-[#008DDA]">View profile →</Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </Layout>
  );
}
