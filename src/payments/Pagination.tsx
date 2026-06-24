import { Button, HStack, Text } from "@chakra-ui/react";
import type { PageInfo } from "../gen/common/v1/common_pb";

interface Props {
  pageInfo?: PageInfo;
  page: number;
  onPage: (page: number) => void;
  loading?: boolean;
}

export function Pagination({ pageInfo, page, onPage, loading }: Props) {
  const totalPage = pageInfo ? Math.max(Number(pageInfo.totalPage), 1) : 1;
  const totalItems = pageInfo ? Number(pageInfo.totalItems) : 0;

  return (
    <HStack justify="flex-end" gap={2}>
      <Button
        size="sm"
        variant="outline"
        disabled={loading || page <= 1}
        onClick={() => onPage(page - 1)}
      >
        Previous
      </Button>
      <Text fontSize="sm" color="gray.600">
        Page {page} of {totalPage} ({totalItems} total)
      </Text>
      <Button
        size="sm"
        variant="outline"
        disabled={loading || page >= totalPage}
        onClick={() => onPage(page + 1)}
      >
        Next
      </Button>
    </HStack>
  );
}
