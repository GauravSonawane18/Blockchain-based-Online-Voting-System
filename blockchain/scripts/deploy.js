async function main() {

  const Voting = await ethers.getContractFactory("Voting");

  const voting = await Voting.deploy();

  await voting.waitForDeployment();

  console.log(
    "Voting contract deployed to:",
    await voting.getAddress()
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
