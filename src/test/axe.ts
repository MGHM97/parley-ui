import axe from 'axe-core';

export async function axeViolations(container: Element) {
  const { violations } = await axe.run(container, {
    rules: { 'color-contrast': { enabled: false } },
  });
  return violations.map(({ id, help, nodes }) => ({
    id,
    help,
    targets: nodes.map((n) => n.target),
  }));
}
