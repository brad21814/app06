
const emails = [
    'john.doe@gmail.com',
    'jane@hotmail.com',
    'bob@yahoo.com',
    'alice@outlook.com',
    'user@icloud.com',
    'admin@company.com',
    'steve@startup.io',
    'me@my-domain.net'
];

const commonProviders = ['gmail', 'hotmail', 'yahoo', 'outlook', 'icloud', 'protonmail', 'aol'];

emails.forEach(email => {
    console.log(`Email: ${email}`);

    const name = email.split('@')[0];
    const domain = email.split('@')[1];
    let accountName = '';

    if (domain) {
        const domainName = domain.split('.')[0].toLowerCase();
        if (commonProviders.includes(domainName)) {
            // Capitalize first letter of name for better aesthetics
            const capitalizedName = name.charAt(0).toUpperCase() + name.slice(1);
            accountName = `${capitalizedName}'s Organization`;
        } else {
            accountName = domainName;
            // Capitalize domain for better aesthetics? Maybe not, keep it simple as before or just use what was there.
            // Previous logic: parts[0]
        }
    }

    console.log(`  Derived Account Name: ${accountName}`);
    console.log('---');
});
