// Portable launcher for Beginners Mandarin.
// Starts the bundled Node server (hidden) if it isn't already running,
// then opens the app in the user's default browser. Chrome or Edge is
// recommended: they provide the speech recognizer the mic feature uses.
using System;
using System.Diagnostics;
using System.IO;
using System.Net.Sockets;
using System.Threading;
using System.Windows.Forms;

class Launcher
{
    const int Port = 3210;

    static string Root
    {
        get { return AppDomain.CurrentDomain.BaseDirectory; }
    }

    static bool PortOpen()
    {
        try
        {
            using (var c = new TcpClient())
            {
                var r = c.BeginConnect("127.0.0.1", Port, null, null);
                bool ok = r.AsyncWaitHandle.WaitOne(300);
                if (ok) c.EndConnect(r);
                return ok;
            }
        }
        catch { return false; }
    }

    [STAThread]
    static void Main()
    {
        if (!PortOpen())
        {
            string node = Path.Combine(Root, "node", "node.exe");
            string appDir = Path.Combine(Root, "app");
            if (!File.Exists(node) || !File.Exists(Path.Combine(appDir, "server.js")))
            {
                MessageBox.Show(
                    "Could not find the app files next to the launcher.\n" +
                    "Keep BeginnersMandarin.exe inside its folder (don't move it out alone).",
                    "Beginners Mandarin", MessageBoxButtons.OK, MessageBoxIcon.Error);
                return;
            }

            var psi = new ProcessStartInfo();
            psi.FileName = node;
            psi.Arguments = "server.js";
            psi.WorkingDirectory = appDir;
            psi.UseShellExecute = false;
            psi.CreateNoWindow = true;
            psi.EnvironmentVariables["PORT"] = Port.ToString();
            psi.EnvironmentVariables["HOSTNAME"] = "127.0.0.1";
            psi.EnvironmentVariables["NODE_ENV"] = "production";
            var p = Process.Start(psi);
            try { File.WriteAllText(Path.Combine(Root, "run.pid"), p.Id.ToString()); }
            catch { }

            bool up = false;
            for (int i = 0; i < 150; i++)
            {
                if (PortOpen()) { up = true; break; }
                Thread.Sleep(200);
            }
            if (!up)
            {
                MessageBox.Show(
                    "The app server didn't start within 30 seconds.\n" +
                    "Try running 'Stop Beginners Mandarin.bat' and launching again.",
                    "Beginners Mandarin", MessageBoxButtons.OK, MessageBoxIcon.Error);
                return;
            }
        }

        Process.Start(new ProcessStartInfo
        {
            FileName = "http://127.0.0.1:" + Port,
            UseShellExecute = true
        });
    }
}
