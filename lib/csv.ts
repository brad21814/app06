export interface CSVMember {
    name: string;
    email: string;
    role: 'member' | 'admin';
    teams: string[];
}

export function parseCSV(content: string): CSVMember[] {
    const lines = content.split(/\r?\n/).filter(line => line.trim() !== '');
    const members: CSVMember[] = [];

    for (const line of lines) {
        const parts = line.split(',');
        if (parts.length < 4) continue;

        const name = parts[0].trim();
        const email = parts[1].trim();
        const roleStr = parts[2].trim().toLowerCase();
        const teamsStr = parts[3].trim();

        if (!email) continue;

        const role = roleStr === 'admin' ? 'admin' : 'member';
        // Teams are pipe-separated: "Team A|Team B"
        // Filter out empty strings
        const teams = teamsStr.split('|').map(t => t.trim()).filter(t => t.length > 0);

        members.push({
            name,
            email,
            role,
            teams
        });
    }

    return members;
}
